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
    renderEventCalendars(); // 💡 [추가] 캘린더/일정 렌더링

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

export function setupEventListeners() {
    const searchInput = document.getElementById('stock-code-input');
    const searchBtn = document.getElementById('stock-search-btn');
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.modal .close-btn');

    // 1. 개별 종목 검색 버튼 클릭
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            // 💡 참고: 실제로는 autocomplete에서 선택된 코드값을 사용해야 할 수 있습니다.
            const stockCode = searchInput.value.split(' ')[0]; // 코드만 추출 (예: "005930")
            fetchAndRenderStockData(stockCode);
        });
    }

    // 2. 검색창에서 엔터 키 입력
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
        
        // (참고: Autocomplete 검색 로직은 이 함수 내에 추가되어야 할 수 있습니다)
    }

    // 3. 아코디언 메뉴 클릭
    document.querySelectorAll('.accordion-header').forEach(button => {
        button.addEventListener('click', () => {
            const panel = button.nextElementSibling;
            if (panel) {
                panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
            }
        });
    });

    // 4. 모달 닫기 버튼
    if (modal && closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // 5. 모달 바깥 영역 클릭 시 닫기 (선택 사항)
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    }
}

/**
 * 💡 [추가된 함수 1]
 * 자산군별 투자 의견을 렌더링합니다.
 * (analysis.js의 getInvestmentSuggestions를 호출합니다)
 */
function renderInvestmentSuggestions(marketOutlook) {
    const grid = document.getElementById('investment-suggestions-grid');
    if (!grid) return;

    // js/ui.js 상단에서 이미 import 하고 있는 함수를 사용합니다.
    const suggestions = getInvestmentSuggestions(marketOutlook); 
    
    grid.innerHTML = Object.entries(suggestions).map(([asset, details]) => `
        <div class="sector-card">
            <h4 class="sector-title">
                <span class="sector-icon">${details.icon}</span>
                ${asset}
            </h4>
            <p class="sector-outlook">${details.outlook}</p>
            <p class="sector-reason">${details.reason}</p>
        </div>
    `).join('');
}

/**
 * 💡 [추가된 함수 2]
 * 섹터별 전망을 렌더링합니다. (오류의 원인)
 * (간단한 분석 로직을 포함하여 재구성했습니다.)
 */
function renderSectorOutlook(analyzedIndicators) {
    const grid = document.getElementById('sector-outlook-grid');
    if (!grid) return;

    // 주요 지표를 찾습니다.
    const sox = analyzedIndicators.find(i => i.id === 'sox_index');
    const wti = analyzedIndicators.find(i => i.id === 'wti_price');
    const sales = analyzedIndicators.find(i => i.id === 'retail_sales' || i.id === 'auto_sales');
    const cpi = analyzedIndicators.find(i => i.id === 'us_cpi' || i.id === 'cpi');

    // 간단한 섹터별 로직
    const sectors = {
        '반도체 ⚡️': (sox && sox.status === 'positive') ? 
            { outlook: '긍정적', reason: '필라델피아 반도체 지수가 안정적입니다.' } : 
            { outlook: '중립적/부정적', reason: '반도체 지수 모멘텀이 약화되었습니다.' },
        '에너지 🛢️': (wti && wti.value < 80) ?
            { outlook: '중립적', reason: '유가 안정으로 비용 부담이 완화되었습니다.' } :
            { outlook: '긍정적 (유가 상승 시)', reason: '고유가로 인한 수혜가 기대될 수 있습니다.' },
        '경기소비재 🚗': (sales && sales.status === 'positive') ?
            { outlook: '긍정적', reason: '소매 판매 및 자동차 판매가 양호합니다.' } :
            { outlook: '부정적', reason: '소비 심리 위축으로 수요 둔화가 우려됩니다.' },
        '금리민감주 🏦': (cpi && cpi.status === 'positive') ?
            { outlook: '긍정적', reason: '물가 안정으로 금리 인하 기대감이 있습니다.' } :
            { outlook: '부정적', reason: '높은 물가로 인해 고금리 유지가 부담됩니다.' }
    };
    
    grid.innerHTML = Object.entries(sectors).map(([sector, details]) => `
        <div class="sector-card">
            <h4 class="sector-title">${sector}</h4>
            <p class="sector-outlook">${details.outlook}</p>
            <p class="sector-reason">${details.reason}</p>
        </div>
    `).join('');
}

/**
 * 💡 [추가된 함수 3]
 * '자세히 보기' 클릭 시 모달창을 엽니다.
 * (renderDashboard의 이벤트 리스너가 호출합니다.)
 */
function showModal(indicatorId) {
    const modal = document.getElementById('modal');
    const titleEl = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-description');
    const criteriaEl = document.getElementById('modal-criteria');
    
    // js/ui.js 상단에서 이미 import 하고 있는 변수를 사용합니다.
    const details = indicatorDetails[indicatorId];
    if (!details) return;

    if (titleEl) titleEl.innerText = details.title;
    if (descEl) descEl.innerText = details.description;
    if (criteriaEl) {
        criteriaEl.innerHTML = details.criteria.map(item => `<li>${item}</li>`).join('');
    }
    
    // js/ui.js 상단에서 이미 import 하고 있는 함수를 사용합니다.
    showModalChart(indicatorId); 
    
    if (modal) modal.style.display = 'block';
}

/**
 * 💡 [신규 추가]
 * '다가오는 주요 이벤트'와 '월별 발표일' 섹션을 렌더링합니다.
 */
function renderEventCalendars() {
    const economicCalendarGrid = document.getElementById('economic-calendar-grid');
    const releaseScheduleGrid = document.getElementById('release-schedule-grid');

    if (!economicCalendarGrid || !releaseScheduleGrid) {
        console.warn('Calendar grids not found');
        return;
    }

    // 1. '월별 발표일' 렌더링
    try {
        const scheduleHtml = Object.entries(releaseSchedules).map(([key, schedule]) => {
            const details = indicatorDetails[key];
            if (!details) return '';
            
            // Tilde(~)가 붙은 날짜 처리
            const listItems = schedule.dates.map(d => {
                const isApprox = d.startsWith('~');
                const dateText = isApprox ? d.substring(1) : d;
                const approxText = isApprox ? ' (발표일 변동 가능)' : '';
                return `<li>${dateText}${approxText}</li>`;
            }).join('');

            return `
                <div class="release-schedule-card">
                    <h4 class="release-schedule-title">${details.title.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim()}</h4>
                    <ul class="release-schedule-list">
                        ${listItems}
                    </ul>
                </div>
            `;
        }).join('');
        
        if (scheduleHtml.length > 0) {
            releaseScheduleGrid.innerHTML = scheduleHtml;
        } else {
            releaseScheduleGrid.innerHTML = '<p class="loading-text">월별 발표 일정이 없습니다.</p>';
        }
    } catch (e) {
        console.error("Error rendering release schedule grid:", e);
        releaseScheduleGrid.innerHTML = '<p class="loading-text" style="color: #dc3545;">월별 일정 렌더링 오류</p>';
    }

    // 2. '다가오는 주요 이벤트' 렌더링
    try {
        const allEvents = [];
        const today = new Date();
        // indicator.js의 날짜가 2025년 기준이므로, 비교 기준일도 2025년으로 설정합니다.
        const todayInScheduleYear = new Date(2025, today.getMonth(), today.getDate());

        Object.entries(releaseSchedules).forEach(([key, schedule]) => {
            const details = indicatorDetails[key];
            if (details) {
                schedule.dates.forEach(dateStr => {
                    // Tilde(~) 제거
                    const cleanDateStr = dateStr.startsWith('~') ? dateStr.substring(1) : dateStr;
                    try {
                        const eventDate = new Date(`2025-${cleanDateStr}`);
                        if (isNaN(eventDate.getTime())) { // Invalid date check
                             console.warn(`Invalid date string: 2025-${cleanDateStr} for key ${key}`);
                             return; 
                        }
                        
                        if (eventDate >= todayInScheduleYear) {
                            allEvents.push({
                                date: eventDate,
                                dateString: `2025-${cleanDateStr}`,
                                name: details.title.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim(),
                                importance: (key === 'us_cpi' || key === 'nfp') ? '높음' : '보통'
                            });
                        }
                    } catch (dateError) {
                         console.error(`Error parsing date 2025-${cleanDateStr}:`, dateError);
                    }
                });
            }
        });

        // 날짜순으로 정렬
        allEvents.sort((a, b) => a.date - b.date);

        // 상위 10개 이벤트만 추출
        const upcomingEvents = allEvents.slice(0, 10);

        // 날짜별로 그룹화
        const eventsByDate = upcomingEvents.reduce((acc, event) => {
            const dateKey = event.dateString.substring(5); // "MM-DD"
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(event);
            return acc;
        }, {});

        if (Object.keys(eventsByDate).length > 0) {
            economicCalendarGrid.innerHTML = Object.entries(eventsByDate).map(([dateKey, events]) => `
                <div class="calendar-card">
                    <h4 class="calendar-date">📅 2025년 ${dateKey}</h4>
                    ${events.map(event => `
                        <div class="calendar-event">
                            <p class="calendar-event-title">${event.name}</p>
                            <span class="calendar-event-importance" style="color: ${event.importance === '높음' ? '#dc3545' : '#6c757d'};">
                                중요도: ${event.importance}
                            </span>
                        </div>
                    `).join('')}
                </div>
            `).join('');
        } else {
            economicCalendarGrid.innerHTML = '<p class="loading-text">다가오는 주요 이벤트가 없습니다.</p>';
        }
    } catch (e) {
         console.error("Error rendering economic calendar grid:", e);
         economicCalendarGrid.innerHTML = '<p class="loading-text" style="color: #dc3545;">이벤트 캘린더 렌더링 오류</p>';
    }
}
