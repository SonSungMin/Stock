// ==================================================================
// API 키와 프록시 URL 설정
// ==================================================================
const API_KEYS = {
    FRED: '480b8d74e3d546674e8180193c30dbf6',
    ECOS: 'C4UHXGGIUUZ1TNZJOXFM'
};
const PROXY_URL = '/.netlify/functions/proxy?targetUrl=';
const STOCK_INFO_URL = '/.netlify/functions/stock-info?code=';
const STOCK_SEARCH_URL = '/.netlify/functions/stock-list?query=';

let indicatorChart = null;
let stockPriceChart = null;
let stockFinanceChart = null;


// ==================================================================
// 지표 발표일 정보 (2025년 기준)
// ==================================================================
const releaseSchedules = {
    us_cpi: {
        title: '🇺🇸 미국 소비자물가지수 (CPI)',
        dates: ["01-15", "02-12", "03-12", "04-10", "05-13", "06-11", "07-15", "08-12", "09-11", "10-24", "11-13", "12-10"]
    },
    nfp: {
        title: '🇺🇸 비농업 고용지수 (NFP)',
        dates: ["01-10", "02-07", "03-07", "04-04", "05-02", "06-06", "07-03", "08-01", "09-05", "10-03", "11-07", "12-05"]
    },
    philly_fed: {
        title: '🇺🇸 필라델피아 연은 제조업 지수',
        dates: ["01-16", "02-20", "03-20", "04-17", "05-15", "06-19", "07-17", "08-21", "09-18", "10-16", "11-20", "12-18"]
    }
};


// ==================================================================
// 지표 상세 정보 (설명, 판단 기준, FRED/ECOS ID)
// ==================================================================
const indicatorDetails = {
    // === FRED (미국/글로벌) 지표 ===
    yield_spread: { title: '🇺🇸 장단기 금리차', seriesId: ['DGS10', 'DGS2'], description: '미래 경기를 예측하는 핵심 선행 지표입니다...', criteria: [ '✅ <b>정상 범위 (0 이상)</b>', '⚠️ <b>역전폭 축소 (-0.1 ~ 0)</b>', '🚨 <b>경기 침체 우려 (-0.1 미만)</b>' ] },
    exchange_rate: { title: '🇰🇷 원/달러 환율', seriesId: 'DEXKOUS', description: '1달러를 사는 데 필요한 원화의 양입니다...', criteria: [ '💵 <b>환율 안정 (1300원 이하)</b>', ' fluctuating <b>변동성 확대 (1300원 ~ 1350원)</b>', '💸 <b>원화 약세 심화 (1350원 초과)</b>' ] },
    vix: { title: '😱 VIX 지수 (공포 지수)', seriesId: 'VIXCLS', description: '시장의 불안감을 나타내는 지표입니다...', criteria: [ '😌 <b>시장 안정 (20 이하)</b>', '😟 <b>불안 심리 (20 ~ 30)</b>', '😱 <b>공포 심리 (30 초과)</b>' ] },
    dollar_index: { title: '💲 달러 인덱스', seriesId: 'DTWEXBGS', description: '주요 6개국 통화 대비 달러의 가치입니다...', criteria: [ '💲 <b>달러 약세 (100 이하)</b>', '💰 <b>달러 강세 (100 초과)</b>' ] },
    wti_price: { title: '🛢️ WTI 유가', seriesId: 'MCOILWTICO', description: '서부 텍사스산 원유(WTI) 가격입니다...', criteria: [ '⛽ <b>유가 안정 (80달러 이하)</b>', '🔺 <b>상승 압력 (80달러 ~ 100달러)</b>', '🔥 <b>고유가 부담 (100달러 초과)</b>' ] },
    sox_index: { title: '⚡️ 美 반도체 지수 (SOX)', seriesId: 'SOX', description: '필라델피아 반도체 지수입니다...', criteria: [ '📈 <b>상승:</b> 업황 긍정', '📉 <b>하락:</b> 업황 악화' ] },
    auto_sales: { title: '🚗 美 자동차 판매량', seriesId: 'TOTALSA', description: '미국 내 자동차 판매량입니다...', criteria: [ '📈 <b>증가:</b> 소비 심리 개선', '📉 <b>감소:</b> 소비 심리 위축' ] },
    retail_sales: { title: '🛒 美 소매 판매', seriesId: 'MRTSSM44000USS', description: '미국의 전반적인 소비 활동 지표입니다...', criteria: [ '📈 <b>판매 호조:</b> 경기 확장 신호', '📉 <b>판매 부진:</b> 경기 둔화 신호' ] },
    home_price_index: { title: '🏠 美 주택 가격 지수', seriesId: 'CSUSHPINSA', description: 'S&P/Case-Shiller 주택 가격 지수입니다...', criteria: [ '📈 <b>가격 상승:</b> 시장 활성화', '📉 <b>가격 하락:</b> 시장 둔화' ] },
    nfp: { title: '🇺🇸 비농업 고용지수 (NFP)', seriesId: 'PAYEMS', description: '미국의 고용 인구 변동 지표입니다...', criteria: [ '👍 <b>고용 서프라이즈 (25만 이상)</b>', '😐 <b>예상 부합 (15만 ~ 25만)</b>', '👎 <b>고용 쇼크 (15만 미만)</b>' ] },
    us_cpi: { title: '🇺🇸 소비자물가지수 (CPI)', seriesId: 'CPIAUCSL', description: '미국 소비자 물가 변동 지표입니다...', criteria: [ '😌 <b>물가 안정 (2.5% 이하)</b>', '😐 <b>인플레이션 둔화 (2.5% ~ 3.5%)</b>', '🔥 <b>물가 압력 지속 (3.5% 초과)</b>' ] },
    philly_fed: { title: '🇺🇸 필라델피아 연은 제조업 지수', seriesId: 'PHLMAN', description: '미국 제조업 경기의 선행 지표입니다...', criteria: [ '📈 <b>확장 국면 (10 이상)</b>', '😐 <b>보합세 (-5 ~ 10)</b>', '📉 <b>위축 국면 (-5 미만)</b>' ] },
    
    // === ECOS (한국) 지표 ===
    gdp_growth: { title: '🇰🇷 GDP 성장률', description: '한국의 경제 규모 성장률입니다...', criteria: [ '👍 <b>견조한 회복세 (0.7% 이상)</b>', '😐 <b>완만한 성장 (0.3% ~ 0.7%)</b>', '👎 <b>성장 둔화 우려 (0.3% 미만)</b>' ] },
    export_growth: { title: '🇰🇷 수출 증가율', description: '수출 실적의 증감률입니다...', criteria: [ '📈 <b>플러스 전환 (2.0% 이상)</b>', '📊 <b>소폭 개선 (0% ~ 2.0%)</b>', '📉 <b>수출 부진 (0% 미만)</b>' ] },
    cpi: { title: '🇰🇷 소비자물가지수 (CPI)', description: '한국 소비자 물가 변동 지표입니다...', criteria: [ '😌 <b>물가 안정세 (3.0% 이하)</b>', '😐 <b>인플레이션 둔화 (3.0% ~ 4.0%)</b>', '🔥 <b>물가 압력 지속 (4.0% 초과)</b>' ] },
    unemployment: { title: '🇰🇷 실업률', description: '경제활동인구 중 실업자 비율입니다...', criteria: [ '💪 <b>완전고용 수준 (3.0% 이하)</b>', '😥 <b>고용 시장 악화 (3.0% 초과)</b>' ] },
    base_rate: { title: '🇰🇷 기준금리', description: '한국은행의 정책 금리입니다...', criteria: [ '💰 <b>완화적 통화정책 (2.5% 이하)</b>', '⚖️ <b>중립적 금리 수준 (2.5% ~ 3.5%)</b>', '🔒 <b>긴축적 통화정책 (3.5% 초과)</b>' ] },
    industrial_production: { title: '🇰🇷 산업생산지수', description: '주요 산업의 생산 활동 지수입니다...', criteria: [ '🏭 <b>생산 활발 (1.0% 이상)</b>', '😐 <b>생산 보합 (0% ~ 1.0%)</b>', '📉 <b>생산 위축 (0% 미만)</b>' ] },
    consumer_sentiment: { title: '🇰🇷 소비자심리지수 (CSI)', description: '소비자들의 경제 상황 인식 지표입니다...', criteria: [ '😊 <b>소비 심리 낙관 (100 이상)</b>', '😐 <b>소비 심리 중립 (90 ~ 100)</b>', '😟 <b>소비 심리 비관 (90 미만)</b>' ] },
    corp_bond_spread: { title: '🇰🇷 회사채 스프레드', description: '회사채와 국고채 간의 금리 차이입니다...', criteria: [ '✅ <b>신용 위험 완화 (0.8%p 이하)</b>', '⚠️ <b>신용 위험 보통 (0.8%p ~ 1.2%)</b>', '🚨 <b>신용 위험 증가 (1.2%p 초과)</b>' ] },
    kospi: { title: '🇰🇷 코스피 지수', description: '한국을 대표하는 주가 지수입니다...', criteria: ['📊 <b>주요 시장 지수</b>'] },
    producer_price_index: { title: '🇰🇷 생산자물가지수 (PPI)', description: '생산자 공급 가격 변동 지표입니다...', criteria: [ '😌 <b>생산자 물가 안정 (3.0% 이하)</b>', '🔺 <b>생산자 물가 부담 (3.0% 초과)</b>' ] }
};

// ==================================================================
// 초기 실행 함수
// ==================================================================
document.addEventListener('DOMContentLoaded', main);

async function main() {
    if (API_KEYS.FRED.includes('여기에') || API_KEYS.ECOS.includes('여기에')) {
        alert('script.js 파일 상단에 API 키를 먼저 입력해주세요.');
        return;
    }

    setupEventListeners();
    renderInitialPlaceholders();
    renderEconomicCalendar();
    renderReleaseSchedule();

    try {
        const [fredData, ecosData] = await Promise.all([fetchFredIndicators(), fetchEcosIndicators()]);
        
        const allIndicators = [...fredData, ...ecosData].filter(i => i);
        const analyzedIndicators = analyzeIndicators(allIndicators);
        
        const marketOutlook = getMarketOutlook(analyzedIndicators);
        
        renderDashboard(analyzedIndicators, marketOutlook);

    } catch (error) {
        console.error("전체 데이터 로딩 실패:", error);
        document.getElementById('update-time').innerText = "데이터 로딩에 실패했습니다.";
    }
}

// ==================================================================
// 이벤트 리스너 설정
// ==================================================================
function setupEventListeners() {
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
// 개별 종목 데이터 처리
// ==================================================================
async function fetchAndRenderStockData(stockCode) {
    if (!stockCode || !/^\d{6}$/.test(stockCode)) return alert('정확한 6자리 종목 코드를 선택해주세요.');

    const section = document.getElementById('stock-details-section');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    section.innerHTML = '<div class="loading-text" style="padding: 40px 0;">종목 정보를 불러오는 중...</div>';
    
    try {
        const response = await fetch(`${STOCK_INFO_URL}${stockCode}`);
        if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
        const data = await response.json();
        
        section.innerHTML = `
            <div class="stock-header"><h2 id="stock-name"></h2><p class="stock-code" id="stock-code"></p></div>
            <div class="stock-grid">
                <div class="stock-info-card main-price"><p class="card-title">현재가</p><p class="card-value" id="stock-price"></p><p class="card-change" id="stock-change"></p></div>
                <div class="stock-info-card"><p class="card-title">시가총액</p><p class="card-value small" id="stock-market-cap"></p></div>
                <div class="stock-info-card"><p class="card-title">PER / PBR</p><p class="card-value small" id="stock-per-pbr"></p></div>
                <div class="stock-info-card"><p class="card-title">배당수익률</p><p class="card-value small" id="stock-dividend-yield"></p></div>
            </div>
            <div class="chart-grid">
                <div class="stock-chart-container"><h4>일봉 차트</h4><canvas id="stock-price-chart"></canvas></div>
                <div class="stock-chart-container"><h4>연간 실적</h4><canvas id="stock-finance-chart"></canvas></div>
            </div>`;
        
        renderStockDetails(data);
    } catch (error) {
        console.error('종목 정보 조회 실패:', error);
        section.innerHTML = '<p style="color:#dc3545; text-align:center; padding: 40px 0;">종목 정보를 불러오는 데 실패했습니다.</p>';
    }
}

function renderStockDetails(data) {
    const { priceInfo, dailyChart, financialInfo } = data;
    document.getElementById('stock-name').innerText = priceInfo.stck_kr_abrv || 'N/A';
    document.getElementById('stock-code').innerText = priceInfo.stck_shrn_iscd || 'N/A';
    
    const currentPrice = parseInt(priceInfo.stck_prpr.replace(/,/g, ''));
    const change = parseInt(priceInfo.prdy_vrss.replace(/,/g, ''));
    const changeRate = parseFloat(priceInfo.prdy_ctrt);

    document.getElementById('stock-price').innerText = `${currentPrice.toLocaleString()}원`;
    const changeEl = document.getElementById('stock-change');
    changeEl.innerText = `${change > 0 ? '▲' : '▼'} ${Math.abs(change).toLocaleString()}원 (${changeRate}%)`;
    changeEl.style.color = change > 0 ? '#dc3545' : '#0056b3';

    document.getElementById('stock-market-cap').innerText = `${(parseInt(priceInfo.hts_avls) / 100000000).toFixed(1)}조 원`;
    document.getElementById('stock-per-pbr').innerText = `${priceInfo.per || 'N/A'} / ${priceInfo.pbr || 'N/A'}`;
    document.getElementById('stock-dividend-yield').innerText = `${(parseInt(priceInfo.dps.replace(/,/g, '')) / currentPrice * 100).toFixed(2)}%`;

    if(dailyChart) renderStockPriceChart(dailyChart);
    if(financialInfo) renderStockFinanceChart(financialInfo);
}

function renderStockPriceChart(chartData) {
    const ctx = document.getElementById('stock-price-chart').getContext('2d');
    if (stockPriceChart) stockPriceChart.destroy();
    stockPriceChart = new Chart(ctx, { /* ... 차트 설정 ... */ });
}

function renderStockFinanceChart(financialData) {
    const ctx = document.getElementById('stock-finance-chart').getContext('2d');
    if (stockFinanceChart) stockFinanceChart.destroy();
    stockFinanceChart = new Chart(ctx, { /* ... 차트 설정 ... */ });
}

// ==================================================================
// 데이터 Fetch 함수들
// ==================================================================

// FRED API 호출 헬퍼
async function fetchFredData(seriesId, limit = 1) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${API_KEYS.FRED}&file_type=json&sort_order=desc&limit=${limit}`;
    try {
        const res = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP 오류: ${res.status}`);
        const data = await res.json();
        return (data.observations && data.observations.length > 0) ? data.observations : null;
    } catch (error) {
        console.error(`FRED 데이터 로딩 실패 (${seriesId}):`, error);
        return null;
    }
}

// FRED에서 미국/글로벌 지표 가져오기
async function fetchFredIndicators() {
    const fredIndicators = Object.entries(indicatorDetails).filter(([, details]) => details.seriesId);
    
    const promises = fredIndicators.map(async ([key, details]) => {
        if (key === 'yield_spread') {
            const [obs10Y, obs2Y] = await Promise.all([fetchFredData(details.seriesId[0]), fetchFredData(details.seriesId[1])]);
            if (!obs10Y || !obs2Y) return null;
            const spread = parseFloat(obs10Y[0].value) - parseFloat(obs2Y[0].value);
            return { id: key, name: details.title, value: parseFloat(spread.toFixed(2)), unit: "%p", date: obs10Y[0].date.substring(5) };
        }

        const obs = await fetchFredData(details.seriesId);
        if (!obs) return null;

        let value = parseFloat(obs[0].value);
        let unit = '';

        if (key === 'nfp') { value = parseFloat((value / 1000).toFixed(1)); unit = '만명'; }
        else if (key === 'wti_price') { unit = '$/bbl'; }
        else if (key === 'auto_sales') { unit = 'M'; }
        else if (key === 'retail_sales') { unit = '$'; }
        else if (key === 'us_cpi') {
            const obs_1y = await fetchFredData(details.seriesId, 13);
            if (obs_1y && obs_1y.length > 12) {
                value = parseFloat(((parseFloat(obs_1y[0].value) - parseFloat(obs_1y[12].value)) / parseFloat(obs_1y[12].value) * 100).toFixed(1));
            }
            unit = '%';
        }
        
        return { id: key, name: details.title, value, unit, date: obs[0].date.substring(5) };
    });
    return Promise.all(promises);
}

// ECOS에서 한국 지표 가져오기
async function fetchEcosIndicators() {
    const ecosApiUrl = `https://ecos.bok.or.kr/api/KeyStatisticList/${API_KEYS.ECOS}/json/kr/1/100`;
    try {
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(ecosApiUrl)}`);
        if (!response.ok) throw new Error("ECOS API 응답 오류");
        const data = await response.json();
        if (!data.KeyStatisticList || !data.KeyStatisticList.row) return [];
        
        const allStats = data.KeyStatisticList.row;
        const mapping = {
            gdp_growth: { keywords: ['분기', 'GDP', '성장률'] },
            export_growth: { keywords: ['수출', '총액', '증감률'] },
            unemployment: { keywords: ['실업률'] },
            industrial_production: { keywords: ['산업생산지수'] },
            consumer_sentiment: { keywords: ['소비자동향조사', '소비자심리지수'] },
            base_rate: { keywords: ['기준금리'] },
            cpi: { keywords: ['소비자물가지수', '총지수', '증감률'] },
            kospi: { keywords: ['KOSPI'] },
            producer_price_index: { keywords: ['생산자물가지수', '총지수', '등락률'] },
            corp_bond_spread: { keywords: ['회사채', '수익률', '스프레드'] },
        };
        
        const found = {};
        allStats.forEach(stat => {
            for (const [key, value] of Object.entries(mapping)) {
                if (!found[key] && value.keywords.every(kw => stat.KEYSTAT_NAME.includes(kw))) {
                    found[key] = {
                        id: key, name: indicatorDetails[key].title, value: parseFloat(stat.DATA_VALUE),
                        unit: stat.UNIT_NAME, date: stat.TIME.substring(4, 6) + '-' + stat.TIME.substring(6, 8)
                    };
                }
            }
        });
        return Object.values(found);
    } catch (error) {
        console.error("한국은행 데이터 로딩 실패:", error);
        return [];
    }
}


async function fetchHistoricalData(indicatorId) {
    // ... 기존 코드와 동일 ...
}

// ==================================================================
// 데이터 분석 및 가공 함수
// ==================================================================
function analyzeIndicators(indicators) {
    // ... 기존 코드와 동일 ...
}

function getMarketOutlook(analyzedIndicators) {
    // ... 기존 코드와 동일 ...
}

// ==================================================================
// 동적 렌더링 함수들
// ==================================================================

function renderInitialPlaceholders() {
    const allIndicatorKeys = Object.keys(indicatorDetails);
    const grid = document.getElementById('indicator-grid');
    grid.innerHTML = allIndicatorKeys.map(key => 
        `<div class="indicator-card"><p class="loading-text">${indicatorDetails[key].title}<br>Loading...</p></div>`
    ).join('');
    
    document.getElementById('sector-outlook-grid').innerHTML = '<div class="sector-card"><p class="loading-text">섹터 정보 분석 중...</p></div>';
    document.getElementById('investment-suggestions-grid').innerHTML = '<div class="sector-card"><p class="loading-text">투자 정보 분석 중...</p></div>';
}

function renderDashboard(analyzedIndicators, marketOutlook) {
    document.getElementById('update-time').innerText = `마지막 업데이트: ${new Date().toLocaleString('ko-KR')}`;
    
    const outlookSection = document.getElementById('outlook-section');
    outlookSection.className = `${marketOutlook.status}-bg`;
    outlookSection.innerHTML = `
        <div class="outlook-signal">${marketOutlook.signal}</div>
        <h3 class="outlook-title ${marketOutlook.status}-text">${marketOutlook.title}</h3>
        <p class="outlook-analysis">${marketOutlook.analysis}</p>
    `;

    renderSectorOutlook(analyzedIndicators);
    renderInvestmentSuggestions(analyzedIndicators);

    const indicatorGrid = document.getElementById('indicator-grid');
    indicatorGrid.innerHTML = '';
    
    const totalWeight = analyzedIndicators.reduce((sum, ind) => sum + (ind.weight > 0 ? ind.weight : 0), 0);
    analyzedIndicators.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    
    analyzedIndicators.forEach(indicator => {
        if (!indicator || !indicator.id) return;

        const impactRatio = totalWeight > 0 && indicator.weight > 0 ? ((indicator.weight / totalWeight) * 100).toFixed(1) : 0;
        
        const card = document.createElement('div');
        card.className = 'indicator-card';
        if (indicator.status === 'negative') card.classList.add('card-negative-bg');

        const valueText = (typeof indicator.value === 'number') ? `${indicator.value.toLocaleString()}${indicator.unit || ''}` : `<span class="loading-text">N/A</span>`;

        // 다음 발표일 찾기
        const schedule = releaseSchedules[indicator.id];
        let nextDateStr = '';
        if (schedule) {
            const today = new Date();
            const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            const nextDate = schedule.dates.find(d => d > todayStr);
            if(nextDate) nextDateStr = ` (다음 ${nextDate})`;
        }
            
        card.innerHTML = `
            <div>
                <div class="indicator-card-header"><h4>${indicator.name}<br><span class="date">(${indicator.date})${nextDateStr}</span></h4></div>
                <p class="indicator-value">${valueText}</p>
                <div class="indicator-status"><span class="status-icon">${indicator.icon}</span><span class="status-text ${indicator.status}-icon">${indicator.text}</span></div>
            </div>
            <div class="card-footer">
                ${impactRatio > 0 ? `<span class="impact-ratio">영향력 ${impactRatio}%</span>` : ''}
                <button class="details-btn">자세히 보기</button>
            </div>`;
        card.querySelector('.details-btn').addEventListener('click', () => showModal(indicator.id));
        indicatorGrid.appendChild(card);
    });
}

function renderSectorOutlook(analyzedIndicators) {
    // ... 기존 코드와 동일 ...
}

function renderInvestmentSuggestions(analyzedIndicators) {
    // ... 기존 코드와 동일 ...
}

function renderEconomicCalendar() {
    const events = [
        { date: '2025-10-16', title: '🇺🇸 미국 필라델피아 연은 제조업 지수', importance: '보통', description: '미국 제조업 경기의 건전성을 파악할 수 있는 선행 지표 중 하나입니다.' },
        { date: '2025-11-07', title: '🇺🇸 미국 비농업 고용지수 (NFP)', importance: '매우 높음', description: '연말을 앞두고 미국 고용 시장의 추세를 확인할 수 있는 중요한 발표입니다.' },
        { date: '2025-11-13', title: '🇺🇸 미국 소비자물가지수 (CPI)', importance: '매우 높음', description: '다음 해의 통화 정책에 대한 시장의 기대를 형성하는 데 결정적인 역할을 합니다.' }
    ];

    const calendarGrid = document.getElementById('economic-calendar-grid');
    calendarGrid.innerHTML = ''; 

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

function renderReleaseSchedule() {
    const grid = document.getElementById('release-schedule-grid');
    grid.innerHTML = Object.values(releaseSchedules).map(schedule => `
        <div class="release-schedule-card">
            <h4 class="release-schedule-title">${schedule.title}</h4>
            <ul class="release-schedule-list">
                ${schedule.dates.map(date => `<li>${date.replace('-', '월 ')}일</li>`).join('')}
            </ul>
        </div>
    `).join('');
}


// ==================================================================
// 모달 및 차트 관련 함수
// ==================================================================
function getNormalRange(indicatorId) {
    // ... 기존 코드와 동일 ...
}

const rangeAnnotationPlugin = { /* ... 기존 코드와 동일 ... */ };

async function showModal(indicatorId) {
    // ... 기존 코드와 동일 ...
}
