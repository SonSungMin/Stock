// js/charts.js
import { fetchFredData } from './api.js';
import { analyzeMarshallKTrend } from './analysis.js';
import { indicatorDetails } from './indicators.js';

let stockPriceChart = null;
let stockFinanceChart = null;
let marshallKChart = null;
let gdpConsumptionChart = null;
let indicatorChart = null;


export function renderStockPriceChart(chartData) {
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

export function renderStockFinanceChart(financialData) {
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

export async function renderGdpConsumptionChart() {
    const canvas = document.getElementById('gdp-consumption-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (gdpConsumptionChart) gdpConsumptionChart.destroy();

    ctx.font = "16px Arial";
    ctx.fillStyle = "#6c757d";
    ctx.textAlign = "center";
    ctx.fillText("차트 데이터 로딩 중...", canvas.width / 2, canvas.height / 2);
    
    try {
        const [gdpObs, pceObs, usrecObs] = await Promise.all([
            fetchFredData('GDPC1', 200, 'desc'), 
            fetchFredData('PCEC', 200, 'desc'),   
            fetchFredData('USRECQ', 200, 'desc')
        ]);

        if (!gdpObs || !pceObs || !usrecObs) {
            throw new Error("필수 FRED 데이터를 가져오지 못했습니다.");
        }
        
        const gdpMap = new Map(gdpObs.map(d => [d.date, parseFloat(d.value)]));
        const pceMap = new Map(pceObs.map(d => [d.date, parseFloat(d.value)]));
        const usrecMap = new Map(usrecObs.map(d => [d.date, d.value === '1']));
        
        const chartData = [];
        const uniqueDates = Array.from(gdpMap.keys()).sort((a, b) => new Date(a) - new Date(b));
        
        for (let i = 4; i < uniqueDates.length; i++) {
            const currentDate = uniqueDates[i];
            const previousDate = uniqueDates[i - 4];
            
            const currentGdp = gdpMap.get(currentDate);
            const prevGdp = gdpMap.get(previousDate);
            const currentPce = pceMap.get(currentDate);
            const prevPce = pceMap.get(previousDate);

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
            throw new Error("GDP/소비 데이터 가공에 실패했습니다.");
        }

        const labels = chartData.map(d => d.date);
        const recessionAnnotations = [];
        let startRecession = null;

        chartData.forEach((d, index) => {
            if (d.isRecession && startRecession === null) {
                startRecession = index;
            } else if (!d.isRecession && startRecession !== null) {
                recessionAnnotations.push({
                    type: 'box', xMin: startRecession, xMax: index,
                    backgroundColor: 'rgba(108, 117, 125, 0.3)', borderColor: 'transparent'
                });
                startRecession = null;
            }
            if (index === chartData.length - 1 && startRecession !== null) {
                 recessionAnnotations.push({
                    type: 'box', xMin: startRecession, xMax: index + 1,
                    backgroundColor: 'rgba(108, 117, 125, 0.3)', borderColor: 'transparent'
                });
            }
        });

        gdpConsumptionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '실질 GDP 성장률 (%)', data: chartData.map(d => d.gdpGrowth),
                        borderColor: '#28a745', borderWidth: 2, pointRadius: 1, tension: 0.1, pointStyle: 'line' 
                    },
                    {
                        label: '실질 PCE(소비) 성장률 (%)', data: chartData.map(d => d.pceGrowth),
                        borderColor: '#dc3545', borderWidth: 2, pointRadius: 1, tension: 0.1, pointStyle: 'line'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        ticks: {
                            callback: function(value, index) {
                                const year = labels[index].substring(0, 4);
                                const quarter = labels[index].substring(5, 7);
                                return (quarter === '01' || index === 0) ? year : '';
                            },
                            autoSkip: false, maxRotation: 0
                        }
                    },
                    y: { 
                        title: { display: true, text: '성장률 (%)' },
                        grid: {
                            color: ctx => (ctx.tick.value === 0) ? '#333' : 'rgba(0, 0, 0, 0.1)',
                            lineWidth: ctx => (ctx.tick.value === 0) ? 2 : 1
                        }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' },
                    annotation: { annotations: recessionAnnotations }
                }
            }
        });

    } catch (error) {
        console.error("소비/GDP 차트 렌더링 실패:", error);
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#dc3545";
            ctx.textAlign = "center";
            ctx.fillText("차트 데이터 로딩 실패", canvas.width / 2, canvas.height / 2);
        }
    }
}

export async function renderMarshallKChart() {
    const canvas = document.getElementById('marshall-k-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#6c757d";
    ctx.textAlign = "center";
    ctx.fillText("차트 데이터 로딩 중...", canvas.width / 2, canvas.height / 2);

    try {
        const [gdpSeries, m2Series, rateSeries] = await Promise.all([
            fetchFredData('GDP', 2000, 'desc'),
            fetchFredData('M2SL', 5000, 'desc'),
            fetchFredData('DGS10', 15000, 'desc')
        ]);

        if (!gdpSeries || !m2Series || !rateSeries) throw new Error("API로부터 데이터를 가져오지 못했습니다.");

        const gdpMap = new Map(gdpSeries.filter(p => p.value !== '.').map(p => [p.date, parseFloat(p.value)]));
        const m2Map = new Map(m2Series.filter(p => p.value !== '.').map(p => [p.date.substring(0, 7), parseFloat(p.value)]));

        const rateMonthlyAvg = new Map();
        rateSeries.filter(p => p.value !== '.').forEach(p => {
            const monthKey = p.date.substring(0, 7);
            if (!rateMonthlyAvg.has(monthKey)) rateMonthlyAvg.set(monthKey, []);
            rateMonthlyAvg.get(monthKey).push(parseFloat(p.value));
        });
        
        const rateMap = new Map();
        rateMonthlyAvg.forEach((values, key) => {
            rateMap.set(key, values.reduce((a, b) => a + b, 0) / values.length);
        });

        const chartData = [];
        gdpMap.forEach((gdpValue, gdpDate) => {
            const date = new Date(gdpDate);
            const year = date.getFullYear();
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            const quarterMonths = Array.from({length: 3}, (_, i) => `${year}-${String((quarter - 1) * 3 + i + 1).padStart(2, '0')}`);
            
            const m2Values = quarterMonths.map(m => m2Map.get(m)).filter(v => v);
            const rateValues = quarterMonths.map(m => rateMap.get(m)).filter(v => v);

            if (m2Values.length > 0 && rateValues.length > 0) {
                const avgM2 = m2Values.reduce((a, b) => a + b, 0) / m2Values.length;
                const avgRate = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
                chartData.push({
                    label: `${year} Q${quarter}`,
                    marshallK: (avgM2 / gdpValue),
                    interestRate: avgRate,
                    date: date
                });
            }
        });

        if (chartData.length === 0) throw new Error("데이터 매칭 실패");

        chartData.sort((a, b) => a.date - b.date);
        
        analyzeMarshallKTrend(chartData);
        
        if (marshallKChart) marshallKChart.destroy();
        
        const crisisAnnotations = [
            { year: '2000 Q1', label: 'IT 버블' }, { year: '2008 Q3', label: '금융위기' },
            { year: '2020 Q2', label: '팬데믹' }, { year: '1980 Q1', label: '침체' }
        ].map(c => ({
            type: 'line', mode: 'vertical', scaleID: 'x',
            value: chartData.findIndex(d => d.label === c.year),
            borderColor: 'rgba(255, 99, 132, 0.5)', borderWidth: 1,
            label: { content: c.label, enabled: true, position: 'top', font: {size: 10} }
        })).filter(a => a.value !== -1);

        marshallKChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.label),
                datasets: [
                    {
                        label: '국채 10년 (%)', data: chartData.map(d => d.interestRate),
                        borderColor: '#0056b3', yAxisID: 'y', borderWidth: 2, pointRadius: 0
                    },
                    {
                        label: '마샬케이', data: chartData.map(d => d.marshallK),
                        borderColor: '#dc3545', yAxisID: 'y1', borderWidth: 2, pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { ticks: { callback: (v, i, ticks) => chartData[i].label.endsWith('Q1') ? chartData[i].label.substring(0,4) : '', autoSkip: false, maxRotation: 0 }},
                    y: { position: 'left', title: { display: true, text: '금리 (%)' }, ticks: { color: '#0056b3' } },
                    y1: { position: 'right', title: { display: true, text: '마샬케이' }, grid: { drawOnChartArea: false }, ticks: { color: '#dc3545' } }
                },
                plugins: { legend: { position: 'top' }, annotation: { annotations: crisisAnnotations } }
            }
        });

    } catch (error) {
        console.error("마샬케이 차트 렌더링 실패:", error);
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#dc3545";
            ctx.textAlign = "center";
            ctx.fillText("데이터 로딩 실패", canvas.width / 2, canvas.height / 2);
        }
    }
}

export async function showModalChart(indicatorId) {
    const details = indicatorDetails[indicatorId];
    if (!details) return;

    const chartCanvas = document.getElementById('indicator-chart');
    const ctx = chartCanvas.getContext('2d');
    if (indicatorChart) indicatorChart.destroy();
    
    chartCanvas.style.display = 'none';
    
    try {
        let historicalData;
        if (details.seriesId) {
             const series = Array.isArray(details.seriesId) ? details.seriesId[0] : details.seriesId;
             const obs = await fetchFredData(series, 100);
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
                        borderColor: '#0056b3', borderWidth: 2, pointRadius: 1, tension: 0.1
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    } catch(error) {
        console.error("과거 데이터 로딩 실패:", error);
    }
}
