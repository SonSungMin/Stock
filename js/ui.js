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
    
    // 💡 변경된 부분: marketOutlook이 유효하지 않을 경우를 대비하여 방어 코드를 추가합니다.
    if (marketOutlook && marketOutlook.status) {
        outlookSection.className = `outlook-section ${marketOutlook.status}-bg`;
        outlookSection.innerHTML = `
            <div class="outlook-signal">${marketOutlook.signal}</div>
            <h3 class="outlook-title ${marketOutlook.status}-text">${marketOutlook.title}</h3>
            <p class="outlook-analysis">${marketOutlook.analysis}</p>
        `;
    } else {
        // marketOutlook 객체가 없거나 비정상일 경우 오류 메시지를 표시합니다.
        outlookSection.className = 'outlook-section neutral-bg';
        outlookSection.innerHTML = `
            <div class="outlook-signal">🤔</div>
            <h3 class="outlook-title neutral-text">분석 데이터 부족</h3>
            <p class="outlook-analysis">시장 종합 전망을 분석하기 위한 데이터가 부족합니다. 일부 지표를 불러오지 못했을 수 있습니다.</p>
        `;
    }

    renderSectorOutlook(analyzedIndicators);
    renderInvestmentSuggestions(marketOutlook || { status: 'neutral' }); // 💡 marketOutlook이 없을 경우 기본값을 전달합니다.

    const indicatorGrid = document.getElementById('indicator-grid');
    indicatorGrid.innerHTML = '';
    
    if (!analyzedIndicators || analyzedIndicators.length === 0) {
        indicatorGrid.innerHTML = '<p class="loading-text" style="padding: 20px;">표시할 지표 데이터가 없습니다.</p>';
        return;
    }
    
    const weightedIndicators = analyzedIndicators.filter(ind => ind.weight > 0);
    const totalWeight = weightedIndicators.reduce((sum, ind) => sum + ind.weight, 0);

    analyzedIndicators.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    
    analyzedIndicators.forEach(indicator => {
        if (!indicator) return;
        const card = document.createElement('div');
        card.className = 'indicator-card';
        if (indicator.status === 'negative') card.classList.add('card-negative-bg');

        const valueText = `${indicator.value.toLocaleString()}${indicator.unit || ''}`;
        
        let nextDateStr = '';
        const specificSchedule = releaseSchedules[indicator.id];
        const cycleSchedule = releaseCycles[indicator.id];

        if (specificSchedule) {
            const today = new Date();
            const todayInScheduleYear = new Date(2025, today.getMonth(), today.getDate());
            const nextDate = specificSchedule.dates.find(d => new Date(`2025-${d}`) > todayInScheduleYear);
            if(nextDate) nextDateStr = ` <span class="next-date">[다음:${nextDate}]</span>`;
        } else if (cycleSchedule && cycleSchedule.periodicity !== 'daily' && indicator.date) { // 💡 indicator.date가 유효한지 확인
            const currentMonth = parseInt(indicator.date.split('-')[0], 10);
            let nextMonth = currentMonth + (cycleSchedule.periodicity === 'monthly' ? cycleSchedule.offset : 3 + cycleSchedule.offset);
            if (nextMonth > 12) nextMonth = (nextMonth - 1) % 12 + 1;
            nextDateStr = ` <span class="next-date-approx">[다음:${nextMonth}월경]</span>`;
        }
        
        const impactRatio = totalWeight > 0 && indicator.weight > 0 ? ((indicator.weight / totalWeight) * 100).toFixed(1) : 0;

        card.innerHTML = `
            <div>
                <div class="indicator-card-header"><h4>${indicator.name}</h4></div>
                <div class="date-info">
                    <span class="current-date">[현재:${indicator.date || 'N/A'}]</span>${nextDateStr}
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
    const getIndicator = id => analyzedIndicators.find(i => i && i.id === id);

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
        
        let score = validIndicators.reduce((acc, ind) => acc + (ind.status === 'positive' ? 1 : (ind.status === 'negative' ? -1 : 0)), 0);
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
            reason = '관련 지표들이 혼조세를 보입니다.';
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
    const status = marketOutlook.status;

    if (status === 'positive') {
        suggestions = {
            '주식': { icon: '📈', outlook: '비중 확대', reason: '경기 회복 기대감으로 위험자산 선호 심리가 강화될 수 있습니다.' },
            '채권': { icon: '⚖️', outlook: '비중 유지', reason: '경기 회복에 따른 안정적 이자 수익을 기대할 수 있습니다.' },
            '달러': { icon: '💵', outlook: '비중 축소', reason: '안전자산인 달러의 매력도가 감소할 수 있습니다.' },
            '원자재': { icon: '🛢️', outlook: '비중 확대', reason: '경기 회복은 원자재 수요 증가로 이어질 수 있습니다.' }
        };
    } else if (status === 'negative') {
        suggestions = {
            '주식': { icon: '📉', outlook: '비중 축소', reason: '경기 둔화 우려로 기업 실적이 악화될 수 있습니다.' },
            '채권': { icon: '🛡️', outlook: '비중 확대', reason: '대표적인 안전자산으로, 불확실성 시기에 자금이 몰릴 수 있습니다.' },
            '달러': { icon: '💰', outlook: '비중 확대', reason: '안전자산인 달러 수요가 증가할 수 있습니다.' },
            '금': { icon: '✨', outlook: '비중 확대', reason: '인플레이션 헤지 및 안전자산으로서의 가치가 부각될 수 있습니다.' }
        };
    } else { // neutral
        suggestions = {
            '주식': { icon: '📊', outlook: '중립 (섹터별 차별화)', reason: '실적이 뒷받침되는 특정 섹터 위주로 선별적인 투자가 필요합니다.' },
            '채권': { icon: '⚖️', outlook: '비중 유지', reason: '만기가 짧은 단기채 위주의 안정적인 포트폴리오 구성이 유효합니다.' },
            '달러': { icon: '🔄', outlook: '중립', reason: '포트폴리오 헤지 수단으로 활용할 수 있습니다.' },
            '대체투자': { icon: '🏘️', outlook: '관심 필요', reason: '분산 투자 효과를 위해 대체 자산에 대한 관심이 필요합니다.' }
        };
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
    const grid = document.getElementById('economic-calendar-grid');
    grid.innerHTML = `
        <div class="calendar-card">
            <div class="calendar-date">2025년 11월 07일</div>
            <div class="calendar-event">
                <div class="calendar-event-title">🇺🇸 미국 비농업 고용지수 (NFP)</div>
                <div class="calendar-event-importance">중요도: 매우 높음</div>
            </div>
        </div>
        <div class="calendar-card">
            <div class="calendar-date">2025년 11월 13일</div>
            <div class="calendar-event">
                <div class="calendar-event-title">🇺🇸 미국 소비자물가지수 (CPI)</div>
                <div class="calendar-event-importance">중요도: 매우 높음</div>
            </div>
        </div>`;
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

export function setupEventListeners() {
    // 아코디언 메뉴 이벤트
    document.querySelectorAll(".accordion-header").forEach(header => {
        header.addEventListener("click", () => {
            const panel = header.nextElementSibling;
            panel.style.display = panel.style.display === "block" ? "none" : "block";
        });
    });

    // 모달창 이벤트
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close-btn');
    
    if (closeBtn && modal) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    window.onclick = (event) => { 
        if (event.target === modal) {
            modal.style.display = 'none'; 
        }
    };

    // 💡 변경된 부분: 검색 관련 요소들이 모두 존재하는지 확인 후 이벤트를 연결합니다.
    const searchInput = document.getElementById('stock-code-input');
    const searchBtn = document.getElementById('stock-search-btn');
    const autocompleteList = document.getElementById('autocomplete-list');

    if (searchInput && searchBtn && autocompleteList) {
        const performSearch = () => {
            const stockCode = searchInput.dataset.stockCode || '';
            if (stockCode) {
                fetchAndRenderStockData(stockCode);
            } else {
                alert('자동완성 목록에서 종목을 선택해주세요.');
            }
            autocompleteList.style.display = 'none';
        };

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (event) => { 
            if (event.key === 'Enter') {
                performSearch(); 
            }
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
                const stocks = await response.json();
                
                autocompleteList.innerHTML = '';
                if (stocks && stocks.length > 0) {
                    stocks.forEach(stock => {
                        const item = document.createElement('div');
                        item.className = 'autocomplete-item';
                        item.innerHTML = `<span class="stock-name">${stock.name}</span><span class="stock-code-small">${stock.code}</span>`;
                        item.addEventListener('click', () => {
                            searchInput.value = stock.name;
                            searchInput.dataset.stockCode = stock.code; 
                            autocompleteList.style.display = 'none';
                        });
                        autocompleteList.appendChild(item);
                    });
                } else {
                    autocompleteList.innerHTML = `<div class="autocomplete-message">검색 결과 없음</div>`;
                }
                autocompleteList.style.display = 'block';
            } catch (error) {
                console.error('자동완성 오류:', error);
                autocompleteList.innerHTML = `<div class="autocomplete-message error">오류 발생</div>`;
                autocompleteList.style.display = 'block';
            }
        });

        // 자동완성 목록 외부 클릭 시 숨기기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-container')) {
                autocompleteList.style.display = 'none';
            }
        });
    }
}

export function showModal(indicatorId) {
    const details = indicatorDetails[indicatorId];
    if (!details) return;

    document.getElementById('modal-title').innerText = details.title;
    document.getElementById('modal-description').innerText = details.description;
    document.getElementById('modal-criteria').innerHTML = details.criteria.map(c => `<li>${c}</li>`).join('');
    document.getElementById('modal').style.display = 'block';

    showModalChart(indicatorId);
}
