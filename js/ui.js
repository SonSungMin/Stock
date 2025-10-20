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

            // 💡 [수정] 점수를 %로 변환 (범위: -100 ~ +100)
            const score = parseFloat(marketOutlook.score);
            // -100점일 때 0%, 0점일 때 50%, +100점일 때 100%
            const scorePercent = ((score + 100) / 200) * 100;

            outlookSection.innerHTML = `
                <div class="outlook-signal">${marketOutlook.signal}</div>
                <h3 class="outlook-title ${marketOutlook.status}-text">${marketOutlook.title}</h3>
                
                <div class="score-gauge-container">
                    <div class="score-label danger">위험 (≤-50)</div>
                    <div class="score-bar-track">
                        <div class="score-bar ${marketOutlook.status}" style="width: ${scorePercent}%;"></div>
                        <div class="score-current" style="left: ${scorePercent}%;">
                            현재 (${marketOutlook.score}점)
                        </div>
                    </div>
                    <div class="score-label positive">안전 (≥+50)</div>
                </div>
                
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

// ... (파일의 나머지 함수들: renderSectorOutlook, setupEventListeners 등) ...
