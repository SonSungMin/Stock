// js/ui.js
import { releaseSchedules, releaseCycles, indicatorDetails } from './indicators.js';
import { STOCK_SEARCH_URL } from './config.js';
import { fetchAndRenderStockData } from './stock.js';
import { showModalChart } from './charts.js';

// ==================================================================
// 동적 렌더링 함수들
// ==================================================================
export function renderInitialPlaceholders() {
    const grid = document.getElementById('indicator-grid');
    grid.innerHTML = Object.values(indicatorDetails).map(details => 
        `<div class="indicator-card"><p class="loading-text">${details.title}<br>Loading...</p></div>`
    ).join('');
}

export function renderDashboard(analyzedIndicators, marketOutlook) {
    document.getElementById('update-time').innerText = `마지막 업데이트: ${new Date().toLocaleString('ko-KR')}`;
    
    const outlookSection = document.getElementById('outlook-section');
    if (marketOutlook && marketOutlook.status) {
        outlookSection.className = `outlook-section ${marketOutlook.status}-bg`;
        outlookSection.innerHTML = `
            <div class="outlook-signal">${marketOutlook.signal}</div>
            <h3 class="outlook-title ${marketOutlook.status}-text">${marketOutlook.title}</h3>
            <p class="outlook-analysis">${marketOutlook.analysis}</p>
        `;
    } else {
        outlookSection.innerHTML = '<p class="loading-text" style="color: #dc3545;">시장 전망을 불러오는 데 실패했습니다.</p>';
    }

    renderSectorOutlook(analyzedIndicators);
    renderInvestmentSuggestions(marketOutlook);

    const indicatorGrid = document.getElementById('indicator-grid');
    indicatorGrid.innerHTML = '';
    
    if (analyzedIndicators.length === 0) {
        indicatorGrid.innerHTML = '<p class="loading-text" style="padding: 20px;">표시할 지표 데이터가 없습니다. API 키나 네트워크 연결을 확인해주세요.</p>';
        return;
    }
    
    const weightedIndicators = analyzedIndicators.filter(ind => ind.weight > 0);
    const totalWeight = weightedIndicators.reduce((sum, ind) => sum + ind.weight, 0);

    analyzedIndicators.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    
    analyzedIndicators.forEach(indicator => {
        const card = document.createElement('div');
        card.className = 'indicator-card';
        if (indicator.status === 'negative') card.classList.add('card-negative-bg');

        const valueText = `${indicator.value.toLocaleString()}${indicator.unit || ''}`;
        
        let nextDateStr = '';
        const specificSchedule = releaseSchedules[indicator.id];
        const cycleSchedule = releaseCycles[indicator.id];

        if (specificSchedule) {
            const today = new Date();
            const todayInScheduleYear = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            todayInScheduleYear.setFullYear(2025);

            const nextDate = specificSchedule.dates.find(d => {
                const scheduleDate = new Date(`2025-${d}`);
                return scheduleDate > todayInScheduleYear;
            });
            
            if(nextDate) {
                nextDateStr = ` <span class="next-date">[다음:${nextDate}]</span>`;
            }
        } else if (cycleSchedule && cycleSchedule.periodicity !== 'daily') {
            const dateParts = indicator.date.split('-');
            const currentMonth = parseInt(dateParts[0], 10);
            
            let nextMonth = currentMonth;
            if (cycleSchedule.periodicity === 'monthly') {
                nextMonth += cycleSchedule.offset;
            } else if (cycleSchedule.periodicity === 'quarterly') {
                const currentQuarterStartMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1;
                nextMonth = currentQuarterStartMonth + 3 + cycleSchedule.offset;
            }
            
            if (nextMonth > 12) {
                nextMonth = ((nextMonth - 1) % 12) + 1;
            }

            nextDateStr = ` <span class="next-date-approx">[다음:${nextMonth}월경]</span>`;
        }
        
        const impactRatio = totalWeight > 0 && indicator.weight > 0 ? ((indicator.weight / totalWeight) * 100).toFixed(1) : 0;

        card.innerHTML = `
            <div>
                <div class="indicator-card-header">
                    <h4>${indicator.name}</h4>
                </div>
                <div class="date-info">
                    <span class="current-date">[현재:${indicator.date}]</span>
                    ${nextDateStr}
                </div>
                <p class="indicator-value">${valueText}</p>
                <div class="indicator-status">
                    <span class="status-icon">${indicator.icon}</span>
                    <span class="status-text ${indicator.status}-icon">${indicator.text}</span>
                </div>
            </div>
            <div class="card-footer">
                ${impactRatio > 0 ? `<span class="impact-ratio">영향력 ${impactRatio}%</span>` : ''}
                <button class="details-btn">자세히 보기</button>
            </div>`;
        card.querySelector('.details-btn').addEventListener('click', () => showModal(indicator.id));
        indicatorGrid.appendChild(card);
    });
}


export function renderSectorOutlook(analyzedIndicators) {
    const grid = document.getElementById('sector-outlook-grid');
    const getIndicator = id => analyzedIndicators.find(i => i.id === id);

    const sectors = {
        '반도체': { icon: '⚡️', indicators: [getIndicator('export_growth'), getIndicator('sox_index')] },
        '자동차': { icon: '🚗', indicators: [getIndicator('exchange_rate'), getIndicator('auto_sales')] },
        '금융': { icon: '🏦', indicators: [getIndicator('yield_spread'), getIndicator('base_rate')] },
        '내수/소비': { icon: '🛒', indicators: [getIndicator('consumer_sentiment'), getIndicator('retail_sales')] }
    };
    
    let html = '';
    for (const [name, data] of Object.entries(sectors)) {
        const validIndicators = data.indicators.filter(i => i);
        if (validIndicators.length === 0) continue;
        
        let score = 0;
        validIndicators.forEach(ind => {
            if(ind.status === 'positive') score++;
            else if(ind.status === 'negative') score--;
        });
        
        let outlook, reason;
        const reasonText = validIndicators.map(i => `'${i.name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim()}'(${i.text})`).join(', ');

        if (score > 0) {
            outlook = '<span class="positive-text">긍정적</span>';
            reason = `${reasonText} 등이 긍정적 신호를 보냅니다.`;
        } else if (score < 0) {
            outlook = '<span class="negative-text">부정적</span>';
            reason = `${reasonText} 등이 부담으로 작용합니다.`;
        } else {
            outlook = '<span>중립적</span>';
            reason = '관련 지표들이 혼조세를 보이며 명확한 방향성을 나타내지 않고 있습니다.';
        }

        html += `
            <div class="sector-card">
                <h3 class="sector-title"><span class="sector-icon">${data.icon}</span>${name}</h3>
                <p class="sector-outlook">${outlook}</p>
                <p class="sector-reason">${reason}</p>
            </div>`;
    }
    grid.innerHTML = html || '<p class="loading-text">섹터 전망을 분석할 데이터가 부족합니다.</p>';
}

export function renderInvestmentSuggestions(marketOutlook) {
    const grid = document.getElementById('investment-suggestions-grid');
    let suggestions = {};

    switch (marketOutlook.status) {
        case 'positive':
            suggestions = {
                '주식': { icon: '📈', outlook: '비중 확대', reason: '경기 회복 기대감으로 위험자산 선호 심리가 강화될 수 있습니다. 성장주 중심의 포트폴리오를 고려할 수 있습니다.' },
                '채권': { icon: '⚖️', outlook: '비중 유지', reason: '금리 인상 가능성이 있지만, 경기 회복에 따른 안정적 이자 수익을 기대할 수 있습니다.' },
                '달러': { icon: '💵', outlook: '비중 축소', reason: '위험자산 선호 심리가 강해지면 안전자산인 달러의 매력도가 감소할 수 있습니다.' },
                '원자재': { icon: '🛢️', outlook: '비중 확대', reason: '경기 회복은 원자재 수요 증가로 이어져 가격 상승을 견인할 수 있습니다.' }
            };
            break;
        case 'negative':
            suggestions = {
                '주식': { icon: '📉', outlook: '비중 축소', reason: '경기 둔화 우려로 기업 실적이 악화될 수 있습니다. 가치주, 배당주 중심의 보수적인 접근이 필요합니다.' },
                '채권': { icon: '🛡️', outlook: '비중 확대', reason: '대표적인 안전자산으로, 경기 불확실성 시기에 자금이 몰릴 수 있습니다.' },
                '달러': { icon: '💰', outlook: '비중 확대', reason: '글로벌 불안 심리가 커지면 안전자산인 달러 수요가 증가할 수 있습니다.' },
                '금': { icon: '✨', outlook: '비중 확대', reason: '인플레이션 헤지 및 안전자산으로서의 가치가 부각될 수 있습니다.' }
            };
            break;
        default: // neutral
            suggestions = {
                '주식': { icon: '📊', outlook: '중립 (섹터별 차별화)', reason: '시장 방향성이 불확실하므로, 실적이 뒷받침되는 특정 섹터나 종목 위주로 선별적인 투자가 필요합니다.' },
                '채권': { icon: '⚖️', outlook: '비중 유지', reason: '금리 변동성을 주시하며 만기가 짧은 단기채 위주의 안정적인 포트폴리오 구성이 유효합니다.' },
                '달러': { icon: '🔄', outlook: '중립 (분할 매수/매도)', reason: '변동성을 활용한 트레이딩 관점의 접근 또는 포트폴리오 헤지 수단으로 활용할 수 있습니다.' },
                '대체투자': { icon: '🏘️', outlook: '관심 필요', reason: '전통 자산의 변동성이 클 때, 분산 투자 효과를 위해 부동산, 인프라 등 대체 자산에 대한 관심이 필요합니다.' }
            };
            break;
    }

    grid.innerHTML = Object.entries(suggestions).map(([name, data]) => `
        <div class="sector-card">
            <h3 class="sector-title"><span class="sector-icon">${data.icon}</span>${name}</h3>
            <p class="sector-outlook">${data.outlook}</p>
            <p class="sector-reason">${data.reason}</p>
        </div>`
    ).join('');
}

export function renderEconomicCalendar() {
    const events = [
        { date: '2025-10-16', title: '🇺🇸 미국 필라델피아 연은 제조업 지수', importance: '보통', description: '미국 제조업 경기의 건전성을 파악할 수 있는 선행 지표 중 하나입니다.' },
        { date: '2025-11-07', title: '🇺🇸 미국 비농업 고용지수 (NFP)', importance: '매우 높음', description: '연말을 앞두고 미국 고용 시장의 추세를 확인할 수 있는 중요한 발표입니다.' },
        { date: '2025-11-13', title: '🇺🇸 미국 소비자물가지수 (CPI)', importance: '매우 높음', description: '다음 해의 통화 정책에 대한 시장의 기대를 형성하는 데 결정적인 역할을 합니다.' }
    ];

    const calendarGrid = document.getElementById('economic-calendar-grid');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events
        .map(event => ({ ...event, dateObj: new Date(event.date) }))
        .filter(event => event.dateObj >= today)
        .sort((a, b) => a.dateObj - b.dateObj);

    if (upcomingEvents.length === 0) {
        calendarGrid.innerHTML = '<p>향후 예정된 주요 경제 일정이 없습니다.</p>';
        return;
    }

    calendarGrid.innerHTML = upcomingEvents.map(event => `
        <div class="calendar-card">
            <div class="calendar-date">${event.dateObj.getFullYear()}년 ${event.dateObj.getMonth() + 1}월 ${event.dateObj.getDate()}일</div>
            <div class="calendar-event">
                <div class="calendar-event-title">${event.title}</div>
                <div class="calendar-event-importance">중요도: ${event.importance}</div>
                <div class="calendar-event-description">${event.description}</div>
            </div>
        </div>`).join('');
}

export function renderReleaseSchedule() {
    const grid = document.getElementById('release-schedule-grid');
    const specificSchedules = Object.entries(releaseSchedules).map(([key, value]) => ({
        title: indicatorDetails[key].title,
        dates: value.dates
    }));

    grid.innerHTML = specificSchedules.map(schedule => `
        <div class="release-schedule-card">
            <h4 class="release-schedule-title">${schedule.title}</h4>
            <ul class="release-schedule-list">
                ${schedule.dates.map(date => `<li>${date.replace('-', '월 ')}일</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

// ==================================================================
// 이벤트 리스너 설정
// ==================================================================
export function setupEventListeners() {
    // Accordion
    document.querySelectorAll(".accordion-header").forEach(accordion => {
        accordion.addEventListener("click", () => {
            const panel = accordion.nextElementSibling;
            panel.style.display = panel.style.display === "block" ? "none" : "block";
        });
    });

    // Modal
    const modal = document.getElementById('modal');
    document.querySelector('.close-btn').onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };

    // Stock Search
    const searchInput = document.getElementById('stock-code-input');
    const searchBtn = document.getElementById('stock-search-btn');
    const autocompleteList = document.getElementById('autocomplete-list');

    searchBtn.addEventListener('click', async () => {
        let stockCode = searchInput.dataset.stockCode || '';
        const stockName = searchInput.value.trim();

        if (stockCode) {
            fetchAndRenderStockData(stockCode);
        } else if (stockName) {
            try {
                const response = await fetch(`${STOCK_SEARCH_URL}${encodeURIComponent(stockName)}`);
                const stocks = await response.json();
                if (stocks && stocks.length > 0) {
                    const firstMatch = stocks[0];
                    searchInput.value = firstMatch.name;
                    searchInput.dataset.stockCode = firstMatch.code;
                    fetchAndRenderStockData(firstMatch.code);
                } else {
                    alert(`'${stockName}'에 해당하는 종목을 찾을 수 없습니다.`);
                }
            } catch (error) {
                console.error('종목 검색 오류:', error);
                alert('종목 검색 중 오류가 발생했습니다.');
            }
        } else {
            alert('종목명 또는 코드를 입력해주세요.');
        }
        autocompleteList.style.display = 'none';
    });

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') searchBtn.click();
    });
    
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim();
        searchInput.dataset.stockCode = ''; 
        if (query.length < 1) {
            autocompleteList.style.display = 'none';
            return;
        }
        try {
            const response = await fetch(`${STOCK_SEARCH_URL}${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error(`검색 실패: ${response.status}`);
            const stocks = await response.json();
            
            autocompleteList.innerHTML = '';
            if (stocks && stocks.length > 0) {
                stocks.forEach(stock => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.innerHTML = `<span class="stock-name">${stock.name}</span><span class="stock-code-small">${stock.code}</span><span class="market-badge">${stock.market || ''}</span>`;
                    item.addEventListener('click', () => {
                        searchInput.value = stock.name;
                        searchInput.dataset.stockCode = stock.code; 
                        autocompleteList.style.display = 'none';
                        fetchAndRenderStockData(stock.code);
                    });
                    autocompleteList.appendChild(item);
                });
            } else {
                autocompleteList.innerHTML = `<div class="autocomplete-message">검색 결과가 없습니다</div>`;
            }
            autocompleteList.style.display = 'block';
        } catch (error) {
            console.error('자동완성 오류:', error);
            autocompleteList.innerHTML = `<div class="autocomplete-message error">검색 중 오류 발생</div>`;
            autocompleteList.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container')) {
            autocompleteList.style.display = 'none';
        }
    });
}


// ==================================================================
// 모달 관련 함수
// ==================================================================
export async function showModal(indicatorId) {
    const details = indicatorDetails[indicatorId];
    if (!details) return;

    const modal = document.getElementById('modal');
    document.getElementById('modal-title').innerText = details.title;
    document.getElementById('modal-description').innerText = details.description;
    document.getElementById('modal-criteria').innerHTML = details.criteria.map(c => `<li>${c}</li>`).join('');

    modal.style.display = 'block';

    // 차트 렌더링은 chart.js 모듈에 위임
    showModalChart(indicatorId);
}
