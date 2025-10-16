// js/stock.js
import { STOCK_INFO_URL } from './config.js';
import { renderStockPriceChart, renderStockFinanceChart } from './charts.js';

// ==================================================================
// 개별 종목 데이터 처리
// ==================================================================
export async function fetchAndRenderStockData(stockCode) {
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
