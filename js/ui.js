// js/ui.js
import { releaseSchedules, releaseCycles, indicatorDetails } from './indicators.js';
import { STOCK_SEARCH_URL } from './config.js';
import { fetchAndRenderStockData } from './stock.js';
import { showModalChart } from './charts.js';
import { getInvestmentSuggestions } from './analysis.js';

// ==================================================================
// 동적 렌더링 함수들
// ==================================================================
export function renderInitialPlaceholders() {
    const grid = document.getElementById('indicator-grid');
    if (!grid) return;
    grid.innerHTML = Object.values(indicatorDetails).map(details => 
        `<div class="indicator-card"><p class="loading-text">${details.title}<br>Loading...</p></div>`
    ).join('');
}

export function renderDashboard(analyzedIndicators, marketOutlook) {
    const updateTimeEl = document.getElementById('update-time');
    if (updateTimeEl) updateTimeEl.innerText = `마지막 업데이트: ${new Date().toLocaleString('ko-KR')}`;
    
    const outlookSection = document.getElementById('outlook-section');
    if (outlookSection) {
        if (marketOutlook && marketOutlook.status) {
            outlookSection.className = `outlook-section ${marketOutlook.status}-bg`;
            outlookSection.innerHTML = `
                <div class="outlook-signal">${marketOutlook.signal}</div>
                <h3 class="outlook-title ${marketOutlook.status}-text">${marketOutlook.title}</h3>
                <p class="outlook-analysis">${marketOutlook.analysis}</p>
            `;
        } else {
            outlookSection.className = 'outlook-section neutral-bg';
            outlookSection.innerHTML = `
                <div class="outlook-signal">🤔</div>
                <h3 class="outlook-title neutral-text">분석 데이터 부족</h3>
                <p class="outlook-analysis">시장 종합 전망을 분석하기 위한 데이터가 부족합니다. 일부 지표를 불러오지 못했을 수 있습니다.</p>
            `;
        }
    }

    const indicatorGrid = document.getElementById('indicator-grid');
    if (!indicatorGrid) return;
    
    if (!analyzedIndicators || analyzedIndicators.length === 0) {
        if (document.getElementById('sector-outlook-grid')) document.getElementById('sector-outlook-grid').innerHTML = '<p class="loading-text" style="padding: 20px;">섹터 전망을 분석할 데이터가 부족합니다.</p>';
        if (document.getElementById('investment-suggestions-grid')) document.getElementById('investment-suggestions-grid').innerHTML = '';
        indicatorGrid.innerHTML = '<p class="loading-text" style="padding: 20px;">표시할 지표 데이터가 없습니다.</p>';
        return;
    }

    renderSectorOutlook(analyzedIndicators);
    renderInvestmentSuggestions(marketOutlook || { status: 'neutral' });

    indicatorGrid.innerHTML = '';
    
    const weightedIndicators = analyzedIndicators.filter(ind => ind && ind.weight > 0);
    const totalWeight = weightedIndicators.reduce((sum, ind) => sum + ind.weight, 0);

    analyzedIndicators.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    
    analyzedIndicators.forEach(indicator => {
        if (!indicator) return;
        const card = document.createElement('div');
        card.className = 'indicator-card';
        
        // 💡 [수정] 상태에 따라 배경색 클래스 적용
        if (indicator.status === 'negative') {
            card.classList.add('card-negative-bg');
        } else if (indicator.status === 'neutral') {
            card.classList.add('card-neutral-bg');
        }

        const valueText = `${indicator.value.toLocaleString()}${indicator.unit || ''}`;
        
        let nextDateStr = '';
        const specificSchedule = releaseSchedules[indicator.id];
        const cycleSchedule = releaseCycles[indicator.id];

        if (specificSchedule) {
            const today = new Date();
            const todayInScheduleYear = new Date(2025, today.getMonth(), today.getDate());
            const nextDate = specificSchedule.dates.find(d => new Date(`2025-${d}`) > todayInScheduleYear);
            if(nextDate) nextDateStr = ` <span class="next-date">[다음:${nextDate}]</span>`;
        } else if (cycleSchedule && cycleSchedule.periodicity !== 'daily' && indicator.date) {
            const dateParts = indicator.date.split('-');
            if (dateParts.length === 2) {
                const currentMonth = parseInt(dateParts[0], 10);
                let nextMonth = currentMonth + (cycleSchedule.periodicity === 'monthly' ? cycleSchedule.offset : 3 + cycleSchedule.offset);
                if (nextMonth > 12) nextMonth = (nextMonth - 1) % 12 + 1;
                nextDateStr = ` <span class="next-date-approx">[다음:${nextMonth}월경]</span>`;
            }
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
        const detailsBtn = card.querySelector('.details-btn');
        if (detailsBtn) detailsBtn.addEventListener('click', () => showModal(indicator.id));
        indicatorGrid.appendChild(card);
    });
}

export function renderSectorOutlook(analyzedIndicators) {
    const grid = document.getElementById('sector-outlook-grid');
    if (!grid) return;
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
    if (!grid) return;
    const suggestions = getInvestmentSuggestions(marketOutlook);

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
    if (!grid) return;
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
    if (!grid) return;
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
    document.querySelectorAll(".accordion-header").forEach(header => {
        header.addEventListener("click", () => {
            const panel = header.nextElementSibling;
            if (panel) panel.style.display = panel.style.display === "block" ? "none" : "block";
        });
    });

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

    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-description');
    const modalCriteria = document.getElementById('modal-criteria');
    const modal = document.getElementById('modal');

    if (modalTitle) modalTitle.innerText = details.title;
    if (modalDesc) modalDesc.innerText = details.description;
    if (modalCriteria) modalCriteria.innerHTML = details.criteria.map(c => `<li>${c}</li>`).join('');
    if (modal) modal.style.display = 'block';

    showModalChart(indicatorId);
}
