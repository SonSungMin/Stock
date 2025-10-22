// js/charts.js
import { fetchFredData, fetchEcosCycleData, fetchRecentSP500Data } from './api.js'; // fetchRecentSP500Data 추가
import { hpfilter } from './analysis_tools.js';
import { indicatorDetails } from './indicators.js';

let stockPriceChart = null;
let stockFinanceChart = null;
let marshallKChart = null;
let gdpConsumptionChart = null;
let indicatorChart = null;
let gdpGapChart = null;
let cycleChart = null;
let sp500TrendChart = null; // S&P 500 추세 차트 변수

// 주요 경기 침체 기간과 명칭 정의 (Source of Truth)
const recessionPeriods = {
    '1973-11-01': '오일 쇼크',
    '1980-01-01': '더블 딥 침체',
    '1990-07-01': '걸프전 침체',
    '2001-03-01': 'IT 버블',
    '2007-12-01': '금융위기',
    '2020-02-01': '팬데믹'
};

/**
 * 경기 침체 기간에 대한 회색 음영(box) 어노테이션을 생성합니다.
 */
function createRecessionBoxes(chartData) {
    const boxes = [];
    let startRecession = null;
    chartData.forEach((d, index) => {
        if (d.isRecession && startRecession === null) {
            startRecession = index;
        } else if ((!d.isRecession || index === chartData.length - 1) && startRecession !== null) {
            boxes.push({ type: 'box', xMin: startRecession, xMax: index, backgroundColor: 'rgba(0, 0, 0, 0.05)', borderColor: 'transparent' });
            startRecession = null;
        }
    });
    return boxes;
}
/**
 * 마샬케이 차트와 동일한 방식으로 경기 침체 '레이블' 어노테이션을 생성합니다.
 */
function createRecessionLabels(chartData) {
    return Object.entries(recessionPeriods).map(([date, label]) => {
        const crisisDate = new Date(date);
        const index = chartData.findIndex(d => new Date(d.date) >= crisisDate);
        if (index === -1) return null;
        return { type: 'line', scaleID: 'x', value: index, borderColor: 'rgba(220, 53, 69, 0.7)', borderWidth: 1.5, borderDash: [6, 6], label: { content: label, display: true, position: 'start', yAdjust: 10, font: { size: 11, weight: 'bold' }, color: 'white', backgroundColor: 'rgba(220, 53, 69, 0.7)' } };
    }).filter(Boolean);
}


export function renderStockPriceChart(chartData) {
    const ctx = document.getElementById('stock-price-chart').getContext('2d');
    if (stockPriceChart) stockPriceChart.destroy();
    const labels = chartData.map(d => `${d.stck_bsop_date.substring(4,6)}/${d.stck_bsop_date.substring(6,8)}`);
    const prices = chartData.map(d => parseInt(d.stck_clpr));
    stockPriceChart = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: '종가', data: prices, borderColor: '#0056b3', borderWidth: 2, pointRadius: 1 }] }, options: { responsive: true, maintainAspectRatio: false } });
}

export function renderStockFinanceChart(financialData) {
    const ctx = document.getElementById('stock-finance-chart').getContext('2d');
    if (stockFinanceChart) stockFinanceChart.destroy();
    const labels = financialData.annual.map(d => d.year);
    const revenues = financialData.annual.map(d => parseFloat(d.revenue.replace('조', '')));
    const profits = financialData.annual.map(d => parseFloat(d.profit.replace('조', '')));
    stockFinanceChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [ { label: '매출액 (조원)', data: revenues, backgroundColor: '#a0c4ff' }, { label: '영업이익 (조원)', data: profits, backgroundColor: '#0056b3' } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
}

export async function renderGdpGapChart() {
    const canvas = document.getElementById('gdp-gap-chart');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (gdpGapChart) gdpGapChart.destroy();
    try {
        const [gdpObs, usrecObs] = await Promise.all([
            fetchFredData('GDPC1', 300, 'asc'), // 오름차순 유지
            fetchFredData('USRECQ', 300, 'asc') // 오름차순 유지
        ]);
        if (!gdpObs || !usrecObs) throw new Error("실질 GDP 또는 경기 침체 데이터를 가져오지 못했습니다.");

        const gdpData = gdpObs.map(d => parseFloat(d.value));
        const labels = gdpObs.map(d => d.date);
        const usrecMap = new Map(usrecObs.map(d => [d.date, d.value === '1']));

        const trendData = hpfilter(gdpData, 1600);
        const gdpGapDataValues = gdpData.map((actual, i) => trendData[i] !== 0 ? ((actual / trendData[i]) - 1) * 100 : 0);
        
        const chartData = labels.map((date, index) => ({
            date: date,
            value: gdpGapDataValues[index],
            isRecession: usrecMap.get(date) || false
        }));

        const recessionBoxes = createRecessionBoxes(chartData);
        const recessionLabels = createRecessionLabels(chartData);
        const combinedAnnotations = [...recessionBoxes, ...recessionLabels];

        gdpGapChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'GDP 갭 (%)',
                    data: gdpGapDataValues,
                    backgroundColor: gdpGapDataValues.map(v => v >= 0 ? 'rgba(220, 53, 69, 0.7)' : 'rgba(0, 86, 179, 0.7)')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            callback: function(value, index, ticks) {
                                const label = this.getLabelForValue(value);
                                const year = parseInt(label.substring(0, 4));
                                if (year % 5 === 0 && label.substring(5, 10) === '01-01') { return year; }
                                return null;
                            },
                            autoSkip: false,
                            maxRotation: 0
                        }
                    },
                    y: { title: { display: true, text: 'GDP 갭 (%)' } }
                },
                plugins: {
                    legend: { display: false },
                    annotation: {
                        annotations: combinedAnnotations,
                        clip: false 
                    }
                }
            }
        });
        
        return chartData;
    } catch(error) {
        console.error("GDP 갭 차트 렌더링 실패:", error);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillText("데이터 로딩 실패", canvas.width / 2, canvas.height / 2);
        return null;
    }
}

/**
 * [수정됨]
 * S&P 500 데이터 누락 문제를 해결하기 위해, 데이터 처리 루프를
 * 0번째 요소부터 시작하고, YoY 계산은 i>=4 조건으로 분리합니다.
 */
export async function renderGdpConsumptionChart() {
    const canvas = document.getElementById('gdp-consumption-chart');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (gdpConsumptionChart) gdpConsumptionChart.destroy();
    try {
        // 모든 데이터를 'asc' (오름차순)으로 가져옵니다. limit=10000 유지.
        const [gdpObs, pceObs, usrecObs, sp500Obs] = await Promise.all([
             fetchFredData('GDPC1', 10000, 'asc'), // limit=10000, asc
             fetchFredData('PCEC', 10000, 'asc'), // limit=10000, asc
             fetchFredData('USRECQ', 10000, 'asc'), // limit=10000, asc
             fetchFredData('SP500', 10000, 'asc', 'q', 'eop') // limit=10000, asc
        ]);

        if (!gdpObs || !pceObs || !usrecObs) throw new Error("필수 FRED 데이터를 가져오지 못했습니다.");
        
        const chartData = [];
        const gdpMap = new Map(gdpObs.map(d => [d.date, parseFloat(d.value)]));
        const pceMap = new Map(pceObs.map(d => [d.date, parseFloat(d.value)]));
        const usrecMap = new Map(usrecObs.map(d => [d.date, d.value === '1']));
        const sp500Map = sp500Obs ? new Map(sp500Obs.map(d => [d.date, parseFloat(d.value)])) : new Map();
        
        const uniqueDates = gdpObs.map(d => d.date); 

        // 루프를 0부터 시작하여 모든 S&P 데이터를 포함합니다.
        for (let i = 0; i < uniqueDates.length; i++) {
            const currentDate = uniqueDates[i];
            
            let gdpGrowth = null;
            let pceGrowth = null;

            // YoY 계산은 i >= 4 일 때만 수행
            if (i >= 4) {
                const previousDate = uniqueDates[i - 4];
                // 1. GDP 성장률 (YoY)
                const currentGdp = gdpMap.get(currentDate), prevGdp = gdpMap.get(previousDate);
                gdpGrowth = (currentGdp && prevGdp) ? ((currentGdp / prevGdp) - 1) * 100 : null;

                // 2. PCE 성장률 (YoY)
                const currentPce = pceMap.get(currentDate), prevPce = pceMap.get(previousDate);
                pceGrowth = (currentPce && prevPce) ? ((currentPce / prevPce) - 1) * 100 : null;
            }

            // 3. S&P 500 지수 레벨 (모든 i에 대해 가져옴)
            const currentSp500 = sp500Map.get(currentDate); 
            const sp500Level = (currentSp500 !== undefined && !isNaN(currentSp500)) ? currentSp500 : null; 
            
            // 4. 경기 침체
            const isRecession = usrecMap.get(currentDate) || false;
            
            chartData.push({
                date: currentDate,
                gdpGrowth: gdpGrowth, // i < 4 이면 null
                pceGrowth: pceGrowth, // i < 4 이면 null
                sp500Level: sp500Level, 
                isRecession: isRecession
            });
        }
        
        if (chartData.length === 0) throw new Error("GDP 데이터 가공에 실패했습니다.");
        
        const labels = chartData.map(d => d.date);
        const recessionBoxes = createRecessionBoxes(chartData);
        const recessionLabels = createRecessionLabels(chartData);
        const combinedAnnotations = [...recessionBoxes, ...recessionLabels];

        gdpConsumptionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { 
                        label: 'S&P 500 지수 (우측 축)', 
                        data: chartData.map(d => d.sp500Level), 
                        borderColor: '#dc3545', // 빨간색 유지
                        borderWidth: 2.5,
                        borderDash: [5, 5], 
                        pointRadius: 0,
                        yAxisID: 'y1' 
                    },
                    { 
                        label: '실질 GDP 성장률 (%)', 
                        data: chartData.map(d => d.gdpGrowth), 
                        borderColor: '#28a745', 
                        borderWidth: 2, 
                        pointRadius: 0,
                        yAxisID: 'y' 
                    },
                    { 
                        label: '실질 PCE(소비) 성장률 (%)', 
                        data: chartData.map(d => d.pceGrowth), 
                        borderColor: '#0056b3', 
                        borderWidth: 2, 
                        pointRadius: 0,
                        yAxisID: 'y' 
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
                            callback: function(value, index, ticks) {
                                const label = this.getLabelForValue(value);
                                const year = parseInt(label.substring(0, 4));
                                if (year % 5 === 0 && label.substring(5, 10) === '01-01') { return year; }
                                return null;
                            },
                            autoSkip: false,
                            maxRotation: 0
                        }
                    },
                    y: { 
                        position: 'left',
                        title: { display: true, text: '성장률 (%)' } 
                    },
                    y1: { 
                        position: 'right',
                        title: { display: true, text: 'S&P 500 지수' },
                        grid: { drawOnChartArea: false } 
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    annotation: { 
                        annotations: combinedAnnotations,
                        clip: false 
                    }
                }
            }
        });
        
        return { gdp: gdpObs, pce: pceObs, sp500: sp500Obs };
    } catch (error) {
        console.error("소비/GDP/S&P 500 차트 렌더링 실패:", error);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillText("차트 데이터 로딩 실패", canvas.width / 2, canvas.height / 2);
        return null;
    }
}


export async function renderMarshallKChart() {
    const canvas = document.getElementById('marshall-k-chart');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (marshallKChart) marshallKChart.destroy();
    try {
        // [수정] 모든 데이터를 'asc' (오름차순)으로 가져옵니다. limit 증가.
        const [gdpSeries, m2Series, rateSeries] = await Promise.all([
             fetchFredData('GDP', 10000, 'asc'), // limit 증가, asc
             fetchFredData('M2SL', 10000, 'asc'), // limit 증가, asc (월별 데이터 더 많음)
             fetchFredData('DGS10', 10000, 'asc') // limit 증가, asc (일별 데이터 더 많음)
        ]);
        if (!gdpSeries || !m2Series || !rateSeries) throw new Error("API로부터 데이터를 가져오지 못했습니다.");
        
        const gdpMap = new Map(gdpSeries.filter(p => p.value !== '.').map(p => [p.date, parseFloat(p.value)]));
        const m2Map = new Map(m2Series.filter(p => p.value !== '.').map(p => [p.date.substring(0, 7), parseFloat(p.value)]));
        
        const rateMonthlyAvg = new Map();
        rateSeries.filter(p => p.value !== '.').forEach(p => { 
            const key = p.date.substring(0, 7); 
            if (!rateMonthlyAvg.has(key)) rateMonthlyAvg.set(key, { sum: 0, count: 0 }); 
            rateMonthlyAvg.get(key).sum += parseFloat(p.value);
            rateMonthlyAvg.get(key).count += 1;
        });
        const rateMap = new Map();
        rateMonthlyAvg.forEach((values, key) => {
            if (values.count > 0) rateMap.set(key, values.sum / values.count);
        });
        
        const chartData = [];
        gdpSeries.forEach(gdpPoint => {
             if (gdpPoint.value === '.') return; 
            
            const gdpDate = gdpPoint.date;
            const gdpValue = parseFloat(gdpPoint.value);
            const date = new Date(gdpDate);
            const year = date.getFullYear();
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            
            const quarterMonths = Array.from({length: 3}, (_, i) => `${year}-${String((quarter - 1) * 3 + i + 1).padStart(2, '0')}`);
            
            const m2ValuesInQuarter = quarterMonths.map(m => m2Map.get(m)).filter(v => v !== undefined && !isNaN(v));
            const rateValuesInQuarter = quarterMonths.map(m => rateMap.get(m)).filter(v => v !== undefined && !isNaN(v));

            if (m2ValuesInQuarter.length > 0 && rateValuesInQuarter.length > 0) {
                const avgM2 = m2ValuesInQuarter.reduce((a, b) => a + b, 0) / m2ValuesInQuarter.length;
                const avgRate = rateValuesInQuarter.reduce((a, b) => a + b, 0) / rateValuesInQuarter.length;
                const marshallKValue = avgM2 / gdpValue; 
                
                chartData.push({ 
                    label: `${year} Q${quarter}`, 
                    year: year, 
                    marshallK: marshallKValue, 
                    interestRate: avgRate, 
                    date: date 
                });
            }
        });

        if (chartData.length === 0) throw new Error("마샬케이 데이터 매칭 또는 계산 실패");
        
        const crisisAnnotations = createRecessionLabels(chartData);
        
        marshallKChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.label),
                datasets: [
                    { label: '국채 10년 (%)', data: chartData.map(d => d.interestRate), borderColor: '#0056b3', yAxisID: 'y', borderWidth: 2, pointRadius: 0 },
                    { label: '마샬케이', data: chartData.map(d => d.marshallK), borderColor: '#212529', yAxisID: 'y1', borderWidth: 2, pointRadius: 0 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            callback: function(value, index, ticks) {
                                const data = chartData[index];
                                if (data && data.year % 5 === 0 && data.label.endsWith('Q1')) { return data.year; }
                                return null;
                            },
                            autoSkip: false,
                            maxRotation: 0
                        }
                    },
                    y: { position: 'left', title: { display: true, text: '금리 (%)' } },
                    y1: { position: 'right', title: { display: true, text: '마샬케이' }, grid: { drawOnChartArea: false } }
                },
                plugins: {
                    legend: { position: 'top' },
                    annotation: { annotations: crisisAnnotations, clip: false }
                }
            }
        });
        
        return chartData;
    } catch (error) {
        console.error("마샬케이 차트 렌더링 실패:", error);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillText("데이터 로딩 실패", canvas.width / 2, canvas.height / 2);
        return null;
    }
}


/**
 * [수정됨]
 * 정규 표현식 오류를 수정합니다. (\u{F1FF} -> \u{1F1FF})
 */
export async function showModalChart(indicatorId) {
    const details = indicatorDetails[indicatorId];
    if (!details || !details.seriesId) return;
    const chartCanvas = document.getElementById('indicator-chart');
    const ctx = chartCanvas.getContext('2d');
    if (indicatorChart) indicatorChart.destroy();
    chartCanvas.style.display = 'none';
    try {
        const series = Array.isArray(details.seriesId) ? details.seriesId[0] : details.seriesId;
        // 오름차순('asc')으로 가져와서 reverse() 필요 없도록 수정
        const obs = await fetchFredData(series, 100, 'asc'); 
        if (obs) {
            // 오름차순이므로 reverse() 제거
            const historicalData = obs.map(d => ({date: d.date, value: parseFloat(d.value)})); 
            if (historicalData.length > 0 && historicalData.some(d => d.value !== null && !isNaN(d.value))) { // 유효한 데이터가 있는지 확인
                chartCanvas.style.display = 'block';
                const cleanLabel = details.title.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim();
                indicatorChart = new Chart(ctx, { 
                    type: 'line', 
                    data: { 
                        labels: historicalData.map(d => d.date), 
                        datasets: [{ 
                            label: cleanLabel, 
                            data: historicalData.map(d => d.value), 
                            borderColor: '#0056b3', 
                            borderWidth: 2, 
                            pointRadius: 1 
                        }] 
                    }, 
                    options: { responsive: true, maintainAspectRatio: false } 
                });
            } else {
                 console.warn(`No valid historical data found for ${indicatorId}`);
            }
        }
    } catch(error) {
        console.error(`과거 데이터 로딩 실패 (${indicatorId}):`, error);
    }
}


/**
 * ECOS 경기 순환 차트에 '주요 경기 침체 레이블'을 추가합니다.
 */
export async function renderCycleChart() {
    const canvas = document.getElementById('cycle-chart');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (cycleChart) cycleChart.destroy();

    try {
        // 1. API로부터 데이터 가져오기 (api.js가 120개를 반환, 오름차순)
        const cycleData = await fetchEcosCycleData();
        if (!cycleData || !cycleData.coincident || !cycleData.leading) {
             throw new Error("경기 순환 데이터가 없습니다.");
        }
        
        // 2. 데이터 가공 (API가 이미 오름차순)
        const coincident = cycleData.coincident.map(d => ({ date: d.TIME, value: parseFloat(d.DATA_VALUE) }));
        const leading = cycleData.leading.map(d => ({ date: d.TIME, value: parseFloat(d.DATA_VALUE) }));
        
        const labels = coincident.map(d => `${d.date.substring(0,4)}-${d.date.substring(4,6)}`);
        const coincidentValues = coincident.map(d => d.value);
        
        const leadingMap = new Map(leading.map(d => [d.date, d.value]));
        const leadingValues = coincident.map(d => leadingMap.get(d.date) || null); 

        // [신규 추가] 경기 침체 레이블 생성
        const chartDataForLabels = coincident.map(d => ({ 
            date: `${d.date.substring(0, 4)}-${d.date.substring(4, 6)}-01` 
        }));
        const recessionLabels = createRecessionLabels(chartDataForLabels);

        // 100 기준선 어노테이션 정의
        const baselineAnnotation = {
            type: 'line',
            yMin: 100,
            yMax: 100,
            borderColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth: 1.5,
            borderDash: [6, 6],
            label: {
                content: '기준선 (100)',
                display: true,
                position: 'start',
                font: { size: 10 },
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }
        };

        const combinedAnnotations = [baselineAnnotation, ...recessionLabels];

        // 3. 차트 생성
        cycleChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '선행지수 순환변동치 (미래)',
                        data: leadingValues,
                        borderColor: '#dc3545', 
                        borderWidth: 2.5,
                        pointRadius: 0,
                        tension: 0.1
                    },
                    {
                        label: '동행지수 순환변동치 (현재)',
                        data: coincidentValues,
                        borderColor: '#0056b3', 
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                             // 120개(10년) 데이터에 맞게 매년 1월 표시
                             callback: function(value, index, ticks) {
                                const label = this.getLabelForValue(value);
                                if (label.endsWith('-01')) { 
                                    return label.substring(0, 4); 
                                }
                                return null;
                            },
                            autoSkip: false,
                            maxRotation: 0
                        }
                    },
                    y: { title: { display: true, text: '2020=100' } }
                },
                plugins: {
                    legend: { position: 'top' },
                    annotation: {
                        annotations: combinedAnnotations,
                        clip: false 
                    }
                }
            }
        });
        
        // 4. 분석 함수를 위해 가공된 데이터 반환
        return { coincident, leading };

    } catch(error) {
        console.error("경기 순환 차트 렌더링 실패:", error);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillText("데이터 로딩 실패", canvas.width / 2, canvas.height / 2);
        return null;
    }
}

/**
 * [신규 추가] S&P 500 최근 6개월 추세 차트 렌더링 함수
 */
export function renderSP500TrendChart(sp500Data) {
    const canvas = document.getElementById('sp500-trend-chart');
    if (!canvas) {
        console.error("Canvas element 'sp500-trend-chart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (sp500TrendChart) sp500TrendChart.destroy();

    if (!sp500Data || sp500Data.length === 0) {
        console.warn("No recent S&P 500 data available for trend chart.");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillText("S&P 500 데이터 로딩 실패", canvas.width / 2, canvas.height / 2);
        return;
    }

    // 데이터 가공 ( '.' 값 제외 )
    const validData = sp500Data.filter(d => d.value !== '.');
    const labels = validData.map(d => d.date);
    const prices = validData.map(d => parseFloat(d.value));

    sp500TrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'S&P 500 지수',
                data: prices,
                borderColor: '#dc3545', // 빨간색
                borderWidth: 2,
                pointRadius: 0, // 점 숨기기
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        // [수정] 연도별로 첫 날짜만 표시 (YYYY 형식)
                        callback: function(value, index, ticks) {
                            const label = this.getLabelForValue(value); // 예: "2024-10-22"
                            if (!label) return null;
                            const currentYear = label.substring(0, 4);
                            
                            // 이전 데이터의 연도 확인
                            const prevLabel = this.getLabelForValue(value - 1);
                            const prevYear = prevLabel ? prevLabel.substring(0, 4) : null;

                            // 첫 번째 데이터이거나 연도가 바뀔 때만 연도 표시
                            if (index === 0 || (currentYear !== prevYear)) {
                                return currentYear; // 예: "2024"
                            }
                            return null;
                        },
                        autoSkip: false,
                        maxRotation: 0
                    }
                },
                y: {
                    title: { display: false } // Y축 제목 숨김
                }
            },
            plugins: {
                legend: { display: false } // 범례 숨김
            }
        }
    });
}
