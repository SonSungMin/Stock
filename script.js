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
let marshallKChart = null; // 마샬케이 차트 인스턴스 변수 추가
let gdpConsumptionChart = null; // 소비/GDP 차트 인스턴스 변수 추가


// ==================================================================
// 지표 발표일 정보
// ==================================================================
// 1. 특정일 발표 (미국)
const releaseSchedules = {
    us_cpi: { dates: ["01-15", "02-12", "03-12", "04-10", "05-13", "06-11", "07-15", "08-12", "09-11", "10-24", "11-13", "12-10"] },
    nfp: { dates: ["01-10", "02-07", "03-07", "04-04", "05-02", "06-06", "07-03", "08-01", "09-05", "10-03", "11-07", "12-05"] },
    philly_fed: { dates: ["01-16", "02-20", "03-20", "04-17", "05-15", "06-19", "07-17", "08-21", "09-18", "10-16", "11-20", "12-18"] }
};

// 2. 주기적 발표 (월/분기 단위)
const releaseCycles = {
    yield_spread: { periodicity: 'daily' },
    exchange_rate: { periodicity: 'daily' },
    vix: { periodicity: 'daily' },
    dollar_index: { periodicity: 'daily' },
    wti_price: { periodicity: 'monthly', offset: 1 },
    sox_index: { periodicity: 'daily' },
    auto_sales: { periodicity: 'monthly', offset: 1 },
    retail_sales: { periodicity: 'monthly', offset: 1 },
    home_price_index: { periodicity: 'monthly', offset: 2 },
    gdp_growth: { periodicity: 'quarterly', offset: 1 },
    export_growth: { periodicity: 'monthly', offset: 1 },
    cpi: { periodicity: 'monthly', offset: 1 },
    unemployment: { periodicity: 'monthly', offset: 1 },
    base_rate: { periodicity: 'monthly', offset: 0 }, // 보통 당월 발표
    industrial_production: { periodicity: 'monthly', offset: 1 },
    consumer_sentiment: { periodicity: 'monthly', offset: 0 },
    corp_bond_spread: { periodicity: 'daily' },
    kospi: { periodicity: 'daily' },
    producer_price_index: { periodicity: 'monthly', offset: 1 }
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
    
    // 마샬케이, GDP/소비 차트 및 분석을 병렬로 호출
    await Promise.all([
        renderMarshallKChart(), // 마샬케이 차트 렌더링 함수 호출
        renderGdpConsumptionChart(), // 소비/GDP 사이클 차트 렌더링 함수 호출
        analyzeGdpConsumption() // 소비/GDP 사이클 분석 함수 호출
    ]);


    try {
        const [fredData, ecosData] = await Promise.all([
            fetchFredIndicators(), 
            fetchEcosIndicators()
        ]);
        
        const allIndicators = [...fredData, ...ecosData].filter(i => i && typeof i.value === 'number' && !isNaN(i.value));
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
    changeEl.innerText = `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toLocaleString()}원 (${change >= 0 ? '+' : ''}${changeRate}%)`;
    changeEl.style.color = change >= 0 ? '#dc3545' : '#0056b3';

    document.getElementById('stock-market-cap').innerText = `${(parseInt(priceInfo.hts_avls) / 1000000000000).toFixed(1)}조 원`;
    document.getElementById('stock-per-pbr').innerText = `${priceInfo.per || 'N/A'} / ${priceInfo.pbr || 'N/A'}`;
    const dividendYield = (parseInt(priceInfo.dps.replace(/,/g, '')) / currentPrice * 100);
    document.getElementById('stock-dividend-yield').innerText = isNaN(dividendYield) ? 'N/A' : `${dividendYield.toFixed(2)}%`;

    if(dailyChart) renderStockPriceChart(dailyChart);
    if(financialInfo) renderStockFinanceChart(financialInfo);
}

function renderStockPriceChart(chartData) {
    const ctx = document.getElementById('stock-price-chart').getContext('2d');
    if (stockPriceChart) stockPriceChart.destroy();
    
    const labels = chartData.map(d => `${d.stck_bsop_date.substring(4,6)}/${d.stck_bsop_date.substring(6,8)}`);
    const prices = chartData.map(d => parseInt(d.stck_clpr));

    stockPriceChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: '종가', data: prices, borderColor: '#0056b3', borderWidth: 2, pointRadius: 1 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderStockFinanceChart(financialData) {
    const ctx = document.getElementById('stock-finance-chart').getContext('2d');
    if (stockFinanceChart) stockFinanceChart.destroy();

    const labels = financialData.annual.map(d => d.year);
    const revenues = financialData.annual.map(d => parseFloat(d.revenue.replace('조', '')));
    const profits = financialData.annual.map(d => parseFloat(d.profit.replace('조', '')));
    
    stockFinanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: '매출액 (조원)', data: revenues, backgroundColor: '#a0c4ff' },
                { label: '영업이익 (조원)', data: profits, backgroundColor: '#0056b3' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
}

// ==================================================================
// 데이터 Fetch 함수들
// ==================================================================
async function fetchFredData(seriesId, limit = 1, sortOrder = 'desc') {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${API_KEYS.FRED}&file_type=json&sort_order=${sortOrder}&limit=${limit}`;
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

async function fetchFredIndicators() {
    const fredIndicators = Object.entries(indicatorDetails).filter(([, details]) => details.seriesId);
    
    const promises = fredIndicators.map(async ([key, details]) => {
        if (key === 'yield_spread') {
            const [obs10Y, obs2Y] = await Promise.all([fetchFredData(details.seriesId[0]), fetchFredData(details.seriesId[1])]);
            if (!obs10Y || !obs2Y || obs10Y[0].value === '.' || obs2Y[0].value === '.') return null;
            const spread = parseFloat(obs10Y[0].value) - parseFloat(obs2Y[0].value);
            return { id: key, name: details.title, value: parseFloat(spread.toFixed(2)), unit: "%p", date: obs10Y[0].date.substring(5) };
        }

        const obs = await fetchFredData(details.seriesId);
        if (!obs || !obs[0] || obs[0].value === '.') return null;

        let value = parseFloat(obs[0].value);
        let unit = '';

        if (key === 'nfp') { value = parseFloat((value / 1000).toFixed(1)); unit = '만명'; }
        else if (key === 'wti_price') { unit = '$/bbl'; }
        else if (key === 'auto_sales') { unit = 'M'; }
        else if (key === 'us_cpi') {
            const obs_1y = await fetchFredData(details.seriesId, 13);
            if (obs_1y && obs_1y.length > 12) {
                 value = parseFloat(((parseFloat(obs_1y[0].value) - parseFloat(obs_1y[12].value)) / parseFloat(obs_1y[12].value) * 100).toFixed(1));
            } else {
                return null; // 1년 전 데이터가 없으면 계산 불가
            }
            unit = '%';
        }
        
        return { id: key, name: details.title, value, unit, date: obs[0].date.substring(5) };
    });
    return Promise.all(promises);
}

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
                    if (stat.TIME && stat.DATA_VALUE) {
                        found[key] = {
                            id: key, name: indicatorDetails[key].title, value: parseFloat(stat.DATA_VALUE),
                            unit: stat.UNIT_NAME, date: stat.TIME.substring(4, 6) + '-' + stat.TIME.substring(6, 8)
                        };
                    }
                }
            }
        });
        return Object.values(found);
    } catch (error) {
        console.error("한국은행 데이터 로딩 실패:", error);
        return [];
    }
}


// ==================================================================
// 데이터 분석 및 가공 함수
// ==================================================================
function analyzeIndicators(indicators) {
    return indicators.map(indicator => {
        const { id, value } = indicator;
        let status = 'neutral', icon = '😐', text = '보통', weight = 2; // 기본값

        switch (id) {
            case 'yield_spread':
                if (value >= 0) { status = 'positive'; icon = '✅'; text = '정상 범위'; } 
                else if (value > -0.1) { status = 'neutral'; icon = '⚠️'; text = '역전폭 축소'; } 
                else { status = 'negative'; icon = '🚨'; text = '침체 우려'; }
                weight = 5;
                break;
            case 'exchange_rate':
                if (value <= 1300) { status = 'positive'; icon = '💵'; text = '환율 안정'; }
                else if (value <= 1350) { status = 'neutral'; icon = ' fluctuating'; text = '변동성 확대'; }
                else { status = 'negative'; icon = '💸'; text = '원화 약세'; }
                weight = 4;
                break;
            case 'vix':
                if (value <= 20) { status = 'positive'; icon = '😌'; text = '시장 안정'; }
                else if (value <= 30) { status = 'neutral'; icon = '😟'; text = '불안 심리'; }
                else { status = 'negative'; icon = '😱'; text = '공포 심리'; }
                weight = 4;
                break;
            case 'dollar_index':
                if (value <= 100) { status = 'positive'; icon = '💲'; text = '달러 약세'; }
                else { status = 'negative'; icon = '💰'; text = '달러 강세'; }
                weight = 3;
                break;
            case 'wti_price':
                if (value <= 80) { status = 'positive'; icon = '⛽'; text = '유가 안정'; }
                else if (value <= 100) { status = 'neutral'; icon = '🔺'; text = '상승 압력'; }
                else { status = 'negative'; icon = '🔥'; text = '고유가 부담'; }
                weight = 3;
                break;
            case 'gdp_growth':
                if (value >= 0.7) { status = 'positive'; icon = '👍'; text = '견조한 회복세'; }
                else if (value >= 0.3) { status = 'neutral'; icon = '😐'; text = '완만한 성장'; }
                else { status = 'negative'; icon = '👎'; text = '성장 둔화 우려'; }
                weight = 5;
                break;
            case 'export_growth':
                if (value >= 2.0) { status = 'positive'; icon = '📈'; text = '플러스 전환'; }
                else if (value >= 0) { status = 'neutral'; icon = '📊'; text = '소폭 개선'; }
                else { status = 'negative'; icon = '📉'; text = '수출 부진'; }
                weight = 5;
                break;
            case 'cpi':
            case 'us_cpi':
                if (value <= 3.0) { status = 'positive'; icon = '😌'; text = '물가 안정세'; }
                else if (value <= 4.0) { status = 'neutral'; icon = '😐'; text = '인플레 둔화'; }
                else { status = 'negative'; icon = '🔥'; text = '물가 압력 지속'; }
                weight = 4;
                break;
            case 'consumer_sentiment':
                if (value >= 100) { status = 'positive'; icon = '😊'; text = '소비 심리 낙관'; }
                else if (value >= 90) { status = 'neutral'; icon = '😐'; text = '소비 심리 중립'; }
                else { status = 'negative'; icon = '😟'; text = '소비 심리 비관'; }
                weight = 3;
                break;
            case 'corp_bond_spread':
                if (value <= 0.8) { status = 'positive'; icon = '✅'; text = '신용 위험 완화'; }
                else if (value <= 1.2) { status = 'neutral'; icon = '⚠️'; text = '신용 위험 보통'; }
                else { status = 'negative'; icon = '🚨'; text = '신용 위험 증가'; }
                weight = 4;
                break;
            case 'nfp':
                if (value >= 250) { status = 'positive'; icon = '👍'; text = '고용 서프라이즈'; }
                else if (value >= 150) { status = 'neutral'; icon = '😐'; text = '예상 부합'; }
                else { status = 'negative'; icon = '👎'; text = '고용 쇼크'; }
                weight = 5;
                break;
            case 'philly_fed':
                if (value >= 10) { status = 'positive'; icon = '📈'; text = '확장 국면'; }
                else if (value >= -5) { status = 'neutral'; icon = '😐'; text = '보합세'; }
                else { status = 'negative'; icon = '📉'; text = '위축 국면'; }
                weight = 3;
                break;
             case 'unemployment':
                if (value <= 3.0) { status = 'positive'; icon = '💪'; text = '완전고용 수준'; }
                else { status = 'negative'; icon = '😥'; text = '고용 시장 악화'; }
                weight = 3;
                break;
            case 'base_rate':
                if (value <= 2.5) { status = 'positive'; icon = '💰'; text = '완화적'; }
                else if (value <= 3.5) { status = 'neutral'; icon = '⚖️'; text = '중립적'; }
                else { status = 'negative'; icon = '🔒'; text = '긴축적'; }
                weight = 4;
                break;
             case 'industrial_production':
                if (value >= 1.0) { status = 'positive'; icon = '🏭'; text = '생산 활발'; }
                else if (value >= 0) { status = 'neutral'; icon = '😐'; text = '생산 보합'; }
                else { status = 'negative'; icon = '📉'; text = '생산 위축'; }
                weight = 3;
                break;
            case 'producer_price_index':
                if (value <= 3.0) { status = 'positive'; icon = '😌'; text = '생산자 물가 안정'; }
                else { status = 'negative'; icon = '🔺'; text = '생산자 물가 부담'; }
                weight = 2;
                break;
            // 가치 자체가 판단 기준이 아닌 지표들
            case 'sox_index':
            case 'auto_sales':
            case 'retail_sales':
            case 'home_price_index':
            case 'kospi':
                text = '시장 지수'; weight = 0; // 가중치 0으로 설정하여 전망 계산에서 제외
                break;
        }
        return { ...indicator, status, icon, text, weight };
    });
}

function getMarketOutlook(analyzedIndicators) {
    if (analyzedIndicators.length === 0) {
        return { status: 'neutral', signal: '🤔', title: '데이터 부족', analysis: '주요 지표 데이터가 부족하여 시장 전망을 분석할 수 없습니다.' };
    }

    const weightedIndicators = analyzedIndicators.filter(ind => ind.weight > 0);
    if (weightedIndicators.length === 0) {
        return { status: 'neutral', signal: '📊', title: '분석 불가', analysis: '전망을 분석하는 데 사용되는 주요 지표를 불러오지 못했습니다.' };
    }

    const totalWeight = weightedIndicators.reduce((sum, ind) => sum + ind.weight, 0);
    let score = 0;

    weightedIndicators.forEach(ind => {
        if (ind.status === 'positive') score += ind.weight;
        else if (ind.status === 'negative') score -= ind.weight;
    });
    
    const outlookScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;
    
    const positiveSignals = weightedIndicators.filter(i => i.status === 'positive').sort((a,b) => b.weight - a.weight).slice(0, 3);
    const negativeSignals = weightedIndicators.filter(i => i.status === 'negative').sort((a,b) => b.weight - a.weight).slice(0, 3);

    const formatSignalText = (signals) => {
        if (signals.length === 0) return '';
        return signals.map(s => s.name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim()).join(', ');
    };

    let analysisText;
    if (outlookScore > 30) {
        analysisText = `주요 경제 지표들이 견조한 모습을 보이고 있습니다. 특히 긍정적인 신호를 보내고 있는 <b>${formatSignalText(positiveSignals)}</b> 등이 경기 회복과 증시 상승에 대한 기대감을 높이고 있습니다. 위험자산 선호 심리가 강화될 수 있습니다.`;
        return { status: 'positive', signal: '📈', title: '긍정적 전망', analysis: analysisText };
    } else if (outlookScore < -30) {
        analysisText = `여러 경제 지표에서 경고 신호가 나타나고 있습니다. 특히 <b>${formatSignalText(negativeSignals)}</b> 등에서 나타난 우려가 경기 둔화 및 침체 가능성을 높이고 있어, 안전자산 선호 심리가 강해질 수 있습니다.`;
        return { status: 'negative', signal: '📉', title: '부정적 전망', analysis: analysisText };
    } else {
        const positiveText = formatSignalText(positiveSignals);
        const negativeText = formatSignalText(negativeSignals);
        analysisText = `긍정적 지표와 부정적 지표가 혼재되어 명확한 방향성을 보이지 않고 있습니다.`;
        if (positiveText) {
            analysisText += `<br><br><b>[긍정 요인]</b> ${positiveText} 등은 시장에 긍정적인 영향을 주고 있습니다.`
        }
        if (negativeText) {
             analysisText += `<br><b>[부정 요인]</b> 반면, ${negativeText} 등은 부담으로 작용하고 있습니다.`
        }
        analysisText += `<br><br>당분간 시장은 변동성을 보이며 횡보할 가능성이 있습니다.`;
        return { status: 'neutral', signal: '📊', title: '혼조세 전망', analysis: analysisText };
    }
}

// ==================================================================
// 동적 렌더링 함수들
// ==================================================================
function renderInitialPlaceholders() {
    const grid = document.getElementById('indicator-grid');
    grid.innerHTML = Object.values(indicatorDetails).map(details => 
        `<div class="indicator-card"><p class="loading-text">${details.title}<br>Loading...</p></div>`
    ).join('');
}

function renderDashboard(analyzedIndicators, marketOutlook) {
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
        
        // --- 다음 발표일 계산 로직 ---
        let nextDateStr = '';
        const specificSchedule = releaseSchedules[indicator.id];
        const cycleSchedule = releaseCycles[indicator.id];

        if (specificSchedule) { // 1. 특정일 발표
            const today = new Date();
            const todayInScheduleYear = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            todayInScheduleYear.setFullYear(2025); // 비교를 위해 2025년으로 설정

            const nextDate = specificSchedule.dates.find(d => {
                const scheduleDate = new Date(`2025-${d}`);
                return scheduleDate > todayInScheduleYear;
            });
            
            if(nextDate) {
                nextDateStr = ` <span class="next-date">[다음:${nextDate}]</span>`;
            }
        } else if (cycleSchedule && cycleSchedule.periodicity !== 'daily') { // 2. 주기적 발표 (daily 제외)
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


function renderSectorOutlook(analyzedIndicators) {
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

function renderInvestmentSuggestions(marketOutlook) {
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

function renderEconomicCalendar() {
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

function renderReleaseSchedule() {
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
// 모달 및 차트 관련 함수
// ==================================================================
async function showModal(indicatorId) {
    const details = indicatorDetails[indicatorId];
    if (!details) return;

    const modal = document.getElementById('modal');
    document.getElementById('modal-title').innerText = details.title;
    document.getElementById('modal-description').innerText = details.description;
    document.getElementById('modal-criteria').innerHTML = details.criteria.map(c => `<li>${c}</li>`).join('');

    modal.style.display = 'block';

    const chartCanvas = document.getElementById('indicator-chart');
    const ctx = chartCanvas.getContext('2d');
    if (indicatorChart) indicatorChart.destroy();
    
    chartCanvas.style.display = 'none'; // 데이터 로딩 동안 차트 숨김
    
    try {
        let historicalData;
        if (details.seriesId) { // FRED 지표
             const series = Array.isArray(details.seriesId) ? details.seriesId[0] : details.seriesId;
             const obs = await fetchFredData(series, 100); // 100개 데이터
             if(obs) historicalData = obs.map(d => ({date: d.date, value: parseFloat(d.value)})).reverse();
        } 
        
        if (historicalData && historicalData.length > 0) {
            chartCanvas.style.display = 'block';
            indicatorChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: historicalData.map(d => d.date),
                    datasets: [{
                        label: details.title.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim(),
                        data: historicalData.map(d => d.value),
                        borderColor: '#0056b3',
                        borderWidth: 2,
                        pointRadius: 1,
                        tension: 0.1
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    } catch(error) {
        console.error("과거 데이터 로딩 실패:", error);
    }
}

// ==================================================================
// 마샬케이 트렌드 분석 함수
// ==================================================================
function analyzeMarshallKTrend(chartData) {
    const analysisDiv = document.getElementById('marshall-analysis');
    if (!chartData || chartData.length < 8) {
        analysisDiv.innerHTML = '<p class="loading-text">분석할 데이터가 부족합니다.</p>';
        return;
    }

    // 최근 데이터 (최신 2년, 8개 분기)
    const recentData = chartData.slice(-8);
    const currentMarshallK = recentData[recentData.length - 1].marshallK;
    const currentRate = recentData[recentData.length - 1].interestRate;
    const currentQuarter = recentData[recentData.length - 1].fullLabel;
    
    // 1년 전 데이터
    const oneYearAgo = recentData[recentData.length - 5];
    const marshallKChange = currentMarshallK - oneYearAgo.marshallK;
    const rateChange = currentRate - oneYearAgo.interestRate;
    
    // 역사적 평균 (전체 기간)
    const avgMarshallK = chartData.reduce((sum, d) => sum + d.marshallK, 0) / chartData.length;
    const marshallKDeviation = ((currentMarshallK - avgMarshallK) / avgMarshallK) * 100;
    
    // 최고점 대비
    const maxMarshallK = Math.max(...chartData.map(d => d.marshallK));
    const marshallKFromPeak = ((currentMarshallK - maxMarshallK) / maxMarshallK) * 100;
    
    // 분석 판단
    let marketOutlook = '';
    let outlookClass = '';
    let analysis = '';
    
    // 마샬케이가 높고 금리가 높은 상황
    if (currentMarshallK > avgMarshallK && currentRate > 3.5) {
        marketOutlook = '🚨 경기 둔화 및 자산 버블 우려';
        outlookClass = 'warning';
        analysis = `
            <p><strong>현재 상황:</strong></p>
            <ul>
                <li>마샬케이: <strong>${currentMarshallK.toFixed(2)}</strong> (역사적 평균 대비 <strong>${marshallKDeviation > 0 ? '+' : ''}${marshallKDeviation.toFixed(1)}%</strong>)</li>
                <li>10년물 국채 금리: <strong>${currentRate.toFixed(2)}%</strong> (1년 전 대비 <strong>${rateChange > 0 ? '+' : ''}${rateChange.toFixed(2)}%p</strong>)</li>
            </ul>
            <p><strong>⚠️ 위험 신호:</strong></p>
            <ul>
                <li><strong>유동성 과잉:</strong> 마샬케이가 역사적 평균보다 높아 시중에 통화가 과도하게 공급된 상태입니다. 이는 과거 자산 버블과 인플레이션의 선행 지표였습니다.</li>
                <li><strong>긴축 정책의 지연 효과:</strong> 높은 금리에도 불구하고 마샬케이가 높다는 것은 금리 인상의 효과가 아직 경제 전반에 충분히 반영되지 않았음을 의미합니다. 향후 6-12개월 내 경기 둔화가 본격화될 가능성이 있습니다.</li>
                <li><strong>역사적 패턴:</strong> 2008년 금융위기 전에도 유사한 패턴(높은 마샬케이 + 금리 인상)이 관찰되었으며, 이후 급격한 경기 침체가 발생했습니다.</li>
            </ul>
            <p><strong>📉 투자 전략 제안:</strong></p>
            <ul>
                <li><strong>방어적 포지션:</strong> 성장주보다는 배당주, 필수소비재, 헬스케어 등 방어주 중심으로 포트폴리오를 재구성하는 것이 안전합니다.</li>
                <li><strong>현금 비중 확대:</strong> 향후 조정 시 매수 기회를 위해 현금 비중을 30-40% 이상 유지하는 것이 유리합니다.</li>
                <li><strong>채권 투자 고려:</strong> 금리가 정점에 가까워지면 장기 국채 투자로 안정적인 수익을 확보할 수 있습니다.</li>
                <li><strong>리스크 관리:</strong> 레버리지 투자는 최소화하고, 손절매 라인을 명확히 설정해야 합니다.</li>
            </ul>
        `;
    }
    // 마샬케이가 낮아지고 금리가 하락하는 상황
    else if (marshallKChange < 0 && rateChange < 0) {
        marketOutlook = '✅ 경기 회복 초기 신호';
        outlookClass = 'positive';
        analysis = `
            <p><strong>현재 상황:</strong></p>
            <ul>
                <li>마샬케이: <strong>${currentMarshallK.toFixed(2)}</strong> (1년 전 대비 <strong>${marshallKChange.toFixed(2)} 하락</strong>)</li>
                <li>10년물 국채 금리: <strong>${currentRate.toFixed(2)}%</strong> (1년 전 대비 <strong>${rateChange.toFixed(2)}%p 하락</strong>)</li>
            </ul>
            <p><strong>✅ 긍정적 신호:</strong></p>
            <ul>
                <li><strong>유동성 정상화:</strong> 마샬케이 하락은 과잉 유동성이 해소되고 있음을 의미하며, 건강한 경제 구조로 회귀하고 있습니다.</li>
                <li><strong>금리 인하 사이클:</strong> 금리 하락은 연준의 통화 완화 정책을 시사하며, 기업의 자금 조달 비용이 낮아져 투자와 소비가 증가할 수 있습니다.</li>
                <li><strong>경기 회복 초기:</strong> 역사적으로 이런 조합은 경기 침체 후 회복 초기 국면에서 나타나며, 주식 시장에 좋은 진입 시점이 될 수 있습니다.</li>
            </ul>
            <p><strong>📈 투자 전략 제안:</strong></p>
            <ul>
                <li><strong>성장주 관심:</strong> 금리 하락은 성장주에 유리한 환경이며, 기술주와 신산업 섹터에 대한 비중 확대를 고려할 수 있습니다.</li>
                <li><strong>분할 매수:</strong> 아직 초기 신호이므로 한 번에 올인하기보다는 3-6개월에 걸쳐 분할 매수하는 것이 안전합니다.</li>
                <li><strong>섹터 다각화:</strong> 경기 민감주(반도체, 자동차), 금융주 등 회복 수혜주를 포트폴리오에 포함하세요.</li>
            </ul>
        `;
    }
    // 마샬케이가 역사적 최고점 근처
    else if (marshallKFromPeak > -5) {
        marketOutlook = '⚠️ 유동성 피크, 조정 가능성 주의';
        outlookClass = 'warning';
        analysis = `
            <p><strong>현재 상황:</strong></p>
            <ul>
                <li>마샬케이: <strong>${currentMarshallK.toFixed(2)}</strong> (역사적 최고점 <strong>${maxMarshallK.toFixed(2)}</strong> 대비 <strong>${Math.abs(marshallKFromPeak).toFixed(1)}%</strong> 하락)</li>
                <li>10년물 국채 금리: <strong>${currentRate.toFixed(2)}%</strong></li>
            </ul>
            <p><strong>⚠️ 주의 신호:</strong></p>
            <ul>
                <li><strong>유동성 최고점:</strong> 마샬케이가 역사적 최고점 근처에 있다는 것은 시중 유동성이 극대화된 상태로, 더 이상의 상승 여력이 제한적일 수 있습니다.</li>
                <li><strong>조정 가능성:</strong> 과거 데이터를 보면 마샬케이가 정점을 찍은 후 6-18개월 내에 시장 조정이 발생하는 경우가 많았습니다.</li>
                <li><strong>정책 전환 리스크:</strong> 연준이 긴축으로 방향을 틀 경우 유동성 축소가 급격하게 진행될 수 있습니다.</li>
            </ul>
            <p><strong>📊 투자 전략 제안:</strong></p>
            <ul>
                <li><strong>이익 실현:</strong> 큰 수익을 본 종목은 일부 이익 실현을 통해 리스크를 줄이는 것이 현명합니다.</li>
                <li><strong>변동성 대비:</strong> VIX가 낮더라도 옵션 등을 활용한 헤지 전략을 고려하세요.</li>
                <li><strong>단기 트레이딩:</strong> 장기 투자보다는 단기 관점에서 접근하고, 손절매 원칙을 엄격히 지켜야 합니다.</li>
            </ul>
        `;
    }
    // 중립적 상황
    else {
        marketOutlook = '😐 중립적 국면, 신중한 관찰 필요';
        outlookClass = 'neutral';
        analysis = `
            <p><strong>현재 상황:</strong></p>
            <ul>
                <li>마샬케이: <strong>${currentMarshallK.toFixed(2)}</strong> (역사적 평균 대비 <strong>${marshallKDeviation > 0 ? '+' : ''}${marshallKDeviation.toFixed(1)}%</strong>)</li>
                <li>10년물 국채 금리: <strong>${currentRate.toFixed(2)}%</strong></li>
            </ul>
            <p><strong>📊 현재 평가:</strong></p>
            <ul>
                <li><strong>과도기 국면:</strong> 마샬케이와 금리가 모두 중립적 범위에 있어, 시장이 명확한 방향성을 찾지 못하고 있습니다.</li>
                <li><strong>관망 필요:</strong> 향후 2-3개 분기 동안의 추세 변화를 주의 깊게 관찰해야 합니다.</li>
                <li><strong>경제 지표 주시:</strong> 고용, 물가, GDP 등 다른 경제 지표들과 함께 종합적으로 판단해야 합니다.</li>
            </ul>
            <p><strong>⚖️ 투자 전략 제안:</strong></p>
            <ul>
                <li><strong>균형 포트폴리오:</strong> 성장주와 가치주, 국내외 자산을 적절히 배분하여 리스크를 분산하세요.</li>
                <li><strong>선별적 투자:</strong> 시장 전체보다는 펀더멘털이 우수한 개별 종목에 집중하는 것이 유리합니다.</li>
                <li><strong>유연성 유지:</strong> 시장 상황 변화에 따라 신속하게 전략을 조정할 수 있도록 준비하세요.</li>
            </ul>
        `;
    }
    
    analysisDiv.innerHTML = `
        <div class="market-outlook-badge ${outlookClass}">${marketOutlook}</div>
        <div class="analysis-text">${analysis}</div>
        <p class="analysis-footnote">
            <strong>참고:</strong> 마샬케이(Marshall K-ratio)는 통화량(M2)을 GDP로 나눈 값으로, 경제 내 유동성 수준을 나타냅니다. 
            높은 값은 시중에 돈이 많이 풀렸음을(유동성 과잉), 낮은 값은 상대적으로 긴축 상태를 의미합니다. 
            역사적으로 마샬케이의 급등 후 하락은 자산 버블 붕괴와 경기 침체의 선행 지표로 활용되어 왔습니다.
        </p>
    `;
}

// ==================================================================
// 소비와 GDP 사이클 분석 함수
// ==================================================================
async function analyzeGdpConsumption() {
    const analysisDiv = document.getElementById('gdp-consumption-analysis');
    // 분석을 위해 차트 렌더링 함수에서 데이터를 가져오지 않고, 필요한 데이터만 별도로 가져옵니다.
    try {
        // GDPC1: Real Gross Domestic Product, PCEC: Real Personal Consumption Expenditures
        const [gdpObs, pceObs] = await Promise.all([
            fetchFredData('GDPC1', 5, 'desc'), 
            fetchFredData('PCEC', 5, 'desc')   
        ]);

        if (!gdpObs || gdpObs.length < 5 || !pceObs || pceObs.length < 5) {
            throw new Error("GDP 또는 PCE 데이터를 충분히 가져오지 못했습니다. (최소 5분기 필요)");
        }
        
        // 4분기(1년) 대비 성장률 계산 (YoY Growth Rate)
        const currentGdp = parseFloat(gdpObs[0].value);
        const prevYearGdp = parseFloat(gdpObs[4].value);
        const gdpGrowth = ((currentGdp / prevYearGdp) - 1) * 100;
        
        const currentPce = parseFloat(pceObs[0].value);
        const prevYearPce = parseFloat(pceObs[4].value);
        const pceGrowth = ((currentPce / prevYearPce) - 1) * 100;
        
        const latestDate = gdpObs[0].date;

        let outlook = '😐 중립적 국면';
        let outlookClass = 'neutral';
        let analysis = `
            <p><strong>최신 데이터 (${latestDate.substring(5, 7)}월 ${latestDate.substring(8)}) - 전년 동기 대비:</strong></p>
            <ul>
                <li>실질 GDP 성장률: <strong>${gdpGrowth.toFixed(2)}%</strong> (녹색 선)</li>
                <li>실질 PCE(소비) 성장률: <strong>${pceGrowth.toFixed(2)}%</strong> (빨간색 선)</li>
            </ul>
        `;

        if (gdpGrowth > 1.5 && pceGrowth > 1.5) {
            outlook = '✅ 확장 국면';
            outlookClass = 'positive';
            analysis += `
                <p><strong>분석:</strong></p>
                <p>GDP와 소비 모두 견조하게 상승하고 있습니다. 이는 <strong>경기 확장 국면</strong>에 있음을 시사하며, 기업 실적 개선과 고용 증가가 지속될 가능성이 높습니다.</p>
                <p><strong>투자 시사점:</strong> 경기 민감주와 성장주에 대한 긍정적인 전망을 강화합니다.</p>
            `;
        } else if (gdpGrowth < 0 && pceGrowth < 0) {
            outlook = '🚨 경기 침체 국면';
            outlookClass = 'negative';
            analysis += `
                <p><strong>분석:</strong></p>
                <p>GDP와 소비 모두 마이너스 성장을 기록하며 <strong>경기 침체</strong>에 진입했음을 시사합니다. 특히 소비가 크게 위축된 것은 향후 경기 반등에 큰 부담입니다.</p>
                <p><strong>투자 시사점:</strong> 방어주 비중을 높이고, 현금 및 안전자산 비중을 확대하는 보수적인 전략이 필요합니다.</p>
            `;
        } else if (gdpGrowth > pceGrowth && gdpGrowth > 0.5) {
            outlook = '⚠️ 소비 둔화 우려';
            outlookClass = 'warning';
            analysis += `
                <p><strong>분석:</strong></p>
                <p>GDP는 성장세를 유지하고 있으나, 소비 성장률이 GDP보다 낮아지며 <strong>소비 둔화 우려</strong>가 커지고 있습니다. 이는 향후 GDP 성장률 하락의 선행 지표가 될 수 있습니다.</p>
                <p><strong>투자 시사점:</strong> 현재는 괜찮지만, 경기 둔화에 대비하여 포트폴리오의 리스크를 줄일 필요가 있습니다.</p>
            `;
        } else if (pceGrowth > gdpGrowth && pceGrowth > 0.5) {
            outlook = '📈 소비 주도 회복 기대';
            outlookClass = 'positive';
            analysis += `
                <p><strong>분석:</strong></p>
                <p>소비 성장률이 GDP 성장률을 상회하며 <strong>소비 주도의 경기 회복 기대감</strong>이 높습니다. 이는 기업의 재고 소진과 생산 증가로 이어져 GDP를 견인할 가능성이 있습니다.</p>
                <p><strong>투자 시사점:</strong> 내수 관련 소비재 및 서비스 섹터에 대한 관심을 높일 수 있습니다.</p>
            `;
        } else {
             analysis += `
                <p><strong>분석:</strong></p>
                <p>GDP와 소비 성장률이 0에 가깝거나 혼조세를 보이며, 시장이 방향성을 탐색하는 <strong>중립적 국면</strong>에 있습니다. 명확한 추세가 나타날 때까지 신중한 관찰이 필요합니다.</p>
                <p><strong>투자 시사점:</strong> 개별 종목의 펀더멘털과 모멘텀에 집중하는 선별적 투자 전략이 유효합니다.</p>
            `;
        }
        
        analysisDiv.innerHTML = `
            <div class="market-outlook-badge ${outlookClass}">${outlook}</div>
            <div class="analysis-text">${analysis}</div>
        `;

    } catch (error) {
        console.error("GDP/소비 분석 실패:", error);
        analysisDiv.innerHTML = '<p style="color:#dc3545;">GDP/소비 데이터 분석에 실패했습니다.</p>';
    }
}


// ==================================================================
// 소비와 GDP 사이클 차트 렌더링 함수 (동적 차트)
// ==================================================================
async function renderGdpConsumptionChart() {
    const canvas = document.getElementById('gdp-consumption-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (gdpConsumptionChart) gdpConsumptionChart.destroy();

    ctx.font = "16px Arial";
    ctx.fillStyle = "#6c757d";
    ctx.textAlign = "center";
    ctx.fillText("차트 데이터 로딩 중...", canvas.width / 2, canvas.height / 2);
    
    try {
        // GDPC1: Real GDP, PCEC: Real PCE (Consumption), USREC: US Recession Indicators
        // 200개 분기 데이터 (약 50년치) 요청
        const [gdpObs, pceObs, usrecObs] = await Promise.all([
            fetchFredData('GDPC1', 200, 'desc'), 
            fetchFredData('PCEC', 200, 'desc'),   
            fetchFredData('USREC', 200, 'desc') 
        ]);

        if (!gdpObs || !pceObs || !usrecObs) {
            throw new Error("필수 FRED 데이터를 가져오지 못했습니다.");
        }
        
        const gdpMap = new Map(gdpObs.map(d => [d.date, parseFloat(d.value)]));
        const pceMap = new Map(pceObs.map(d => [d.date, parseFloat(d.value)]));
        const usrecMap = new Map(usrecObs.map(d => [d.date, d.value === '1']));
        
        const chartData = [];
        const uniqueDates = Array.from(gdpMap.keys()).sort((a, b) => new Date(a) - new Date(b));
        
        // 4분기(1년) 전 데이터와 비교하여 YoY 성장률 계산
        for (let i = 4; i < uniqueDates.length; i++) {
            const currentDate = uniqueDates[i];
            const previousDate = uniqueDates[i - 4]; // 4분기 전
            
            const currentGdp = gdpMap.get(currentDate);
            const prevGdp = gdpMap.get(previousDate);
            const currentPce = pceMap.get(currentDate);
            const prevPce = pceMap.get(previousDate);

            // 데이터가 유효한지 확인하고 푸시
            if (!isNaN(currentGdp) && !isNaN(prevGdp) && !isNaN(currentPce) && !isNaN(prevPce)) {
                chartData.push({
                    date: currentDate,
                    gdpGrowth: ((currentGdp / prevGdp) - 1) * 100,
                    pceGrowth: ((currentPce / prevPce) - 1) * 100,
                    isRecession: usrecMap.get(currentDate) || false
                });
            }
        }
        
        if (chartData.length === 0) {
            throw new Error("GDP/소비 데이터 가공에 실패했습니다. 유효한 데이터가 부족합니다.");
        }

        const labels = chartData.map(d => d.date);
        const recessionAnnotations = [];
        let startRecession = null;

        // 경기 침체 기간을 배경 막대로 표시하는 Annotation 생성
        chartData.forEach((d, index) => {
            if (d.isRecession && startRecession === null) {
                startRecession = index;
            } else if (!d.isRecession && startRecession !== null) {
                recessionAnnotations.push({
                    type: 'box',
                    xMin: startRecession,
                    xMax: index,
                    backgroundColor: 'rgba(108, 117, 125, 0.3)', // 회색 음영
                    borderColor: 'transparent',
                    borderWidth: 0
                });
                startRecession = null;
            }
            // 데이터 끝에서 침체가 끝나지 않았을 경우 처리
            if (index === chartData.length - 1 && startRecession !== null) {
                 recessionAnnotations.push({
                    type: 'box',
                    xMin: startRecession,
                    xMax: index + 1, // 끝까지
                    backgroundColor: 'rgba(108, 117, 125, 0.3)', 
                    borderColor: 'transparent',
                    borderWidth: 0
                });
            }
        });


        gdpConsumptionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '실질 GDP 성장률 (%)',
                        data: chartData.map(d => d.gdpGrowth),
                        borderColor: '#28a745', // 녹색
                        borderWidth: 2,
                        pointRadius: 1,
                        tension: 0.1,
                        // 원본 그래프처럼 점이 없는 형태로 보이도록 pointStyle을 'line'으로 설정
                        pointStyle: 'line' 
                    },
                    {
                        label: '실질 PCE(소비) 성장률 (%)',
                        data: chartData.map(d => d.pceGrowth),
                        borderColor: '#dc3545', // 빨간색
                        borderWidth: 2,
                        pointRadius: 1,
                        tension: 0.1,
                        pointStyle: 'line'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        ticks: {
                            // 연도별로만 표시
                            callback: function(value, index) {
                                const year = labels[index].substring(0, 4);
                                const quarter = labels[index].substring(5, 7);
                                return (quarter === '01' || index === 0) ? year : '';
                            },
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0
                        }
                    },
                    y: { 
                        beginAtZero: false,
                        title: { display: true, text: '성장률 (%)' },
                        // 원본 그래프와 유사한 Y축 범위 강제 설정 (시각적 유사성을 위해)
                        min: -5.0,
                        max: 5.0,
                        // 0% 라인을 강조하기 위한 설정
                        grid: {
                            color: function(context) {
                                if (context.tick.value === 0) {
                                    return '#333'; // 0% 라인 진하게
                                }
                                return 'rgba(0, 0, 0, 0.1)';
                            },
                            lineWidth: function(context) {
                                if (context.tick.value === 0) {
                                    return 2; // 0% 라인 두껍게
                                }
                                return 1;
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' },
                    annotation: {
                        annotations: recessionAnnotations
                    }
                }
            }
        });

    } catch (error) {
        console.error("소비/GDP 차트 렌더링 실패:", error);
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#dc3545";
            ctx.textAlign = "center";
            ctx.fillText("차트 데이터 로딩 실패", canvas.width / 2, canvas.height / 2 - 10);
            ctx.font = "12px Arial";
            ctx.fillText(error.message, canvas.width / 2, canvas.height / 2 + 15);
        }
    }
}


// ==================================================================
// ===== 마샬케이 차트 렌더링 함수 (로직 수정) =====
// ==================================================================
async function renderMarshallKChart() {
    const canvas = document.getElementById('marshall-k-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#6c757d";
    ctx.textAlign = "center";
    ctx.fillText("차트 데이터 로딩 중...", canvas.width / 2, canvas.height / 2);

    try {
        // 1. 데이터 병렬로 가져오기 (충분한 데이터 확보를 위해 limit 대폭 증가)
        // FRED API가 지원하는 최대치로 설정.
        const [gdpSeries, m2Series, rateSeries] = await Promise.all([
            fetchFredData('GDP', 2000, 'desc'),       // 분기별 데이터
            fetchFredData('M2SL', 5000, 'desc'),      // 월별 데이터
            fetchFredData('DGS10', 15000, 'desc')     // 일별 데이터
        ]);

        if (!gdpSeries || !m2Series || !rateSeries) {
            throw new Error("API로부터 데이터를 가져오지 못했습니다.");
        }

        console.log(`로드된 데이터: GDP ${gdpSeries.length}개, M2 ${m2Series.length}개, 금리 ${rateSeries.length}개`);

        // 2. 데이터를 Map으로 변환 (빠른 검색을 위해)
        const gdpMap = new Map();
        const m2Map = new Map();
        const rateMap = new Map();

        // GDP 데이터 처리 (분기 데이터)
        gdpSeries.forEach(p => {
            if (p.value !== '.') {
                const date = p.date;
                gdpMap.set(date, parseFloat(p.value));
            }
        });

        // M2 데이터 처리 (월별 데이터)
        m2Series.forEach(p => {
            if (p.value !== '.') {
                const date = p.date.substring(0, 7); // YYYY-MM
                m2Map.set(date, parseFloat(p.value));
            }
        });

        // 금리 데이터 처리 (일별 데이터를 월별로 집계)
        const rateMonthlyAvg = new Map();
        rateSeries.forEach(p => {
            if (p.value !== '.') {
                const monthKey = p.date.substring(0, 7); // YYYY-MM
                if (!rateMonthlyAvg.has(monthKey)) {
                    rateMonthlyAvg.set(monthKey, []);
                }
                rateMonthlyAvg.get(monthKey).push(parseFloat(p.value));
            }
        });
        
        // 월별 평균 계산
        rateMonthlyAvg.forEach((values, key) => {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            rateMap.set(key, avg);
        });

        // 3. GDP 기준으로 데이터 매칭
        const chartData = [];
        
        gdpMap.forEach((gdpValue, gdpDate) => {
            const date = new Date(gdpDate);
            
            const year = date.getFullYear();
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            const quarterKey = `${year} Q${quarter}`;

            // 해당 분기의 모든 월에서 M2와 금리 데이터 수집
            const quarterMonths = [];
            for (let m = (quarter - 1) * 3; m < quarter * 3; m++) {
                const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
                quarterMonths.push(monthKey);
            }

            // M2와 금리의 분기 평균 계산
            const m2Values = quarterMonths.map(m => m2Map.get(m)).filter(v => v !== undefined);
            const rateValues = quarterMonths.map(m => rateMap.get(m)).filter(v => v !== undefined);

            if (m2Values.length > 0 && rateValues.length > 0) {
                const avgM2 = m2Values.reduce((a, b) => a + b, 0) / m2Values.length;
                const avgRate = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
                const marshallK = (avgM2 / gdpValue);

                chartData.push({
                    label: `${year}`,
                    fullLabel: quarterKey,
                    marshallK: marshallK,
                    interestRate: avgRate,
                    date: date
                });
            }
        });

        if (chartData.length === 0) {
            throw new Error("데이터 매칭 실패: GDP, M2, 금리를 결합할 수 없습니다.");
        }

        // 날짜순 정렬
        chartData.sort((a, b) => a.date - b.date);

        console.log(`차트 데이터 생성 완료: ${chartData.length}개 분기`);
        
        // 분석 의견 생성
        analyzeMarshallKTrend(chartData);
        
        // 4. Chart.js로 그래프 생성
        if (marshallKChart) marshallKChart.destroy();
        
        // 주요 경제 위기 연도 및 라벨 설정 (미국 기준)
        const crisisAnnotations = [
            { year: '2000 Q1', label: 'IT 버블', color: 'rgba(255, 99, 132, 0.3)' },
            { year: '2008 Q3', label: '글로벌 금융위기', color: 'rgba(255, 99, 132, 0.3)' },
            { year: '2020 Q2', label: '코로나 팬데믹', color: 'rgba(255, 99, 132, 0.3)' },
            { year: '1973 Q4', label: '오일 쇼크', color: 'rgba(255, 99, 132, 0.3)' },
            { year: '1980 Q1', label: '더블 딥 침체', color: 'rgba(255, 99, 132, 0.3)' },
            { year: '1990 Q3', label: '걸프전 침체', color: 'rgba(255, 99, 132, 0.3)' },
        ];
        
        const lineAnnotations = crisisAnnotations.map(c => {
            // 해당 분기의 인덱스 찾기 (차트 상의 위치)
            const index = chartData.findIndex(d => d.fullLabel.startsWith(c.year.substring(0, 4)) && d.fullLabel.endsWith(c.year.substring(5)));
            if (index !== -1) {
                 return {
                    type: 'line',
                    mode: 'vertical',
                    scaleID: 'x',
                    value: index,
                    borderColor: c.color,
                    borderWidth: 2,
                    label: {
                        content: c.label,
                        enabled: true,
                        position: 'top',
                        backgroundColor: c.color.replace('0.3', '0.7'),
                        font: { size: 10, weight: 'bold' }
                    }
                };
            }
            return null;
        }).filter(a => a !== null);


        marshallKChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.fullLabel),
                datasets: [
                    {
                        label: '국채 10년 (%)',
                        data: chartData.map(d => d.interestRate),
                        borderColor: '#0056b3',
                        backgroundColor: 'rgba(0, 86, 179, 0.1)',
                        yAxisID: 'y',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1
                    },
                    {
                        label: '마샬케이',
                        data: chartData.map(d => d.marshallK),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        yAxisID: 'y1',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        ticks: {
                            callback: function(value, index) {
                                const currentYear = chartData[index].label;
                                const currentQuarter = chartData[index].fullLabel.substring(5);
                                return (currentQuarter === 'Q1' || index === 0) ? currentYear : '';
                            },
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0
                        }
                    },
                    y: { 
                        position: 'left', 
                        title: { display: true, text: '금리 (%)' },
                        ticks: { color: '#0056b3' }
                    },
                    y1: { 
                        position: 'right', 
                        title: { display: true, text: '마샬케이' },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#dc3545' }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => items[0].label,
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed.y.toFixed(2);
                                return label;
                            }
                        }
                    },
                    annotation: {
                        annotations: lineAnnotations
                    }
                }
            }
        });

    } catch (error) {
        console.error("마샬케이 차트 렌더링 실패:", error);
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#dc3545";
            ctx.textAlign = "center";
            ctx.fillText("데이터 로딩 실패", canvas.width / 2, canvas.height / 2 - 10);
            ctx.font = "12px Arial";
            ctx.fillText(error.message, canvas.width / 2, canvas.height / 2 + 15);
        }
    }
}
