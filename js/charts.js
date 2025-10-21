// js/charts.js
import { fetchFredData, fetchEcosCycleData } from './api.js';
import { hpfilter } from './analysis_tools.js';
import { indicatorDetails } from './indicators.js'; 

let stockPriceChart = null;
let stockFinanceChart = null;
let marshallKChart = null;
let gdpConsumptionChart = null;
let indicatorChart = null;
let gdpGapChart = null;
let cycleChart = null; 

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
            boxes.push({
                type: 'box',
                xMin: startRecession,
                xMax: index,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderColor: 'transparent',
            });
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

        return {
            type: 'line',
            scaleID: 'x',
            value: index,
            borderColor: 'rgba(220, 53, 69, 0.7)',
            borderWidth: 1.5,
            borderDash: [6, 6],
            label: {
                content: label,
                display: true,
                position: 'start',
                yAdjust: 10,
                font: { size: 11, weight: 'bold' },
                color: 'white',
                backgroundColor: 'rgba(220, 53, 69, 0.7)'
            }
        };
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
 * 1. 모든 FRED 데이터를 오름차순('asc')으로 가져오도록 통일합니다.
 * 2. S&P 500 데이터 limit을 500으로 유지하여 전체 기간 표시를 시도합니다.
 * 3. 데이터 처리 로직(for 루프)은 오름차순 데이터에 맞게 유지합니다.
 * 4. S&P 500 라인 색상을 빨간색으로 유지합니다.
 */
export async function renderGdpConsumptionChart() {
    const canvas = document.getElementById('gdp-consumption-chart');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (gdpConsumptionChart) gdpConsumptionChart.destroy();
    try {
        // 💡 [수정] 모든 데이터를 'asc' (오름차순)으로 가져옵니다. limit 유지.
        const [gdpObs, pceObs, usrecObs, sp500Obs] = await Promise.all([
             fetchFredData('GDPC1', 500, 'asc'), // limit 증가, asc
             fetchFredData('PCEC', 500, 'asc'), // limit 증가, asc
             fetchFredData('USRECQ', 500, 'asc'), // limit 증가, asc
             fetchFredData('SP500', 500, 'asc', 'q', 'eop') // asc, limit=500
        ]);

        // 💡 기준 데이터를 gdpObs (오름차순)로 변경
        if (!gdpObs || !pceObs || !usrecObs) throw new Error("필수 FRED 데이터를 가져오지 못했습니다.");
        
        const chartData = [];
        // 💡 오름차순 데이터이므로 Map 생성 방식은 동일
        const gdpMap = new Map(gdpObs.map(d => [d.date, parseFloat(d.value)]));
        const pceMap = new Map(pceObs.map(d => [d.date, parseFloat(d.value)]));
        const usrecMap = new Map(usrecObs.map(d => [d.date, d.value === '1']));
        const sp500Map = sp500Obs ? new Map(sp500Obs.map(d => [d.date, parseFloat(d.value)])) : new Map();
        
        // 💡 오름차순이므로 sort 필요 없음, gdpObs 자체가 기준 날짜 배열
        const uniqueDates = gdpObs.map(d => d.date); 

        // 💡 오름차순이므로 루프 시작점과 YoY 계산 인덱스 동일 (i와 i-4)
        for (let i = 4; i < uniqueDates.length; i++) {
            const currentDate = uniqueDates[i], previousDate = uniqueDates[i - 4];
            
            // 1. GDP 성장률 (YoY)
            const currentGdp = gdpMap.get(currentDate), prevGdp = gdpMap.get(previousDate);
            const gdpGrowth = (currentGdp && prevGdp) ? ((currentGdp / prevGdp) - 1) * 100 : null;

            // 2. PCE 성장률 (YoY)
            const currentPce = pceMap.get(currentDate), prevPce = pceMap.get(previousDate);
            const pceGrowth = (currentPce && prevPce) ? ((currentPce / prevPce) - 1) * 100 : null;

            // 3. S&P 500 지수 레벨
            const currentSp500 = sp500Map.get(currentDate); 
            const sp500Level = (currentSp500 !== undefined && !isNaN(currentSp500)) ? currentSp500 : null; 
            
            // 4. 경기 침체
            const isRecession = usrecMap.get(currentDate) || false;
            
            chartData.push({
                date: currentDate,
                gdpGrowth: gdpGrowth,
                pceGrowth: pceGrowth,
                sp500Level: sp500Level, 
                isRecession: isRecession
            });
        }
        
        if (chartData.length === 0) throw new Error("GDP 데이터 가공에 실패했습니다.");
        
        // 💡 오름차순 데이터이므로 labels 생성 동일
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
                        borderColor: '#dc3545', // 💡 빨간색 유지
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
        
        // 💡 반환 데이터 순서 변경 없음 (오름차순 raw 데이터 반환)
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
        // 💡 [수정] 모든 데이터를 'asc' (오름차순)으로 가져옵니다. limit 증가.
        const [gdpSeries, m2Series, rateSeries] = await Promise.all([
             fetchFredData('GDP', 500, 'asc'), // limit 증가, asc
             fetchFredData('M2SL', 1000, 'asc'), // limit 증가, asc (월별 데이터 더 많음)
             fetchFredData('DGS10', 3000, 'asc') // limit 증가, asc (일별 데이터 더 많음)
        ]);
        if (!gdpSeries || !m2Series || !rateSeries) throw new Error("API로부터 데이터를 가져오지 못했습니다.");
        
        // 💡 오름차순 데이터이므로 Map 생성 방식 동일
        const gdpMap = new Map(gdpSeries.filter(p => p.value !== '.').map(p => [p.date, parseFloat(p.value)]));
        const m2Map = new Map(m2Series.filter(p => p.value !== '.').map(p => [p.date.substring(0, 7), parseFloat(p.value)]));
        
        // 월 평균 금리 계산 (오름차순 데이터 처리 동일)
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
        // 💡 기준이 되는 GDP 날짜로 루프 (오름차순)
        gdpSeries.forEach(gdpPoint => {
             if (gdpPoint.value === '.') return; // Skip invalid GDP data
            
            const gdpDate = gdpPoint.date;
            const gdpValue = parseFloat(gdpPoint.value);
            const date = new Date(gdpDate);
            const year = date.getFullYear();
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            
            // 해당 분기의 월 이름 생성 (예: '2023-01', '2023-02', '2023-03')
            const quarterMonths = Array.from({length: 3}, (_, i) => `${year}-${String((quarter - 1) * 3 + i + 1).padStart(2, '0')}`);
            
            // 해당 분기의 M2 및 금리 데이터 가져오기
            const m2ValuesInQuarter = quarterMonths.map(m => m2Map.get(m)).filter(v => v !== undefined && !isNaN(v));
            const rateValuesInQuarter = quarterMonths.map(m => rateMap.get(m)).filter(v => v !== undefined && !isNaN(v));

            // 평균 계산 및 chartData에 추가
            if (m2ValuesInQuarter.length > 0 && rateValuesInQuarter.length > 0) {
                const avgM2 = m2ValuesInQuarter.reduce((a, b) => a + b, 0) / m2ValuesInQuarter.length;
                const avgRate = rateValuesInQuarter.reduce((a, b) => a + b, 0) / rateValuesInQuarter.length;
                // 마샬케이 계산: (분기 평균 M2 / 분기 명목 GDP)
                const marshallKValue = avgM2 / gdpValue; 
                
                chartData.push({ 
                    label: `${year} Q${quarter}`, 
                    year: year, 
                    marshallK: marshallKValue, 
                    interestRate: avgRate, 
                    date: date // 정렬 및 레이블 생성을 위한 Date 객체
                });
            }
        });

        if (chartData.length === 0) throw new Error("마샬케이 데이터 매칭 또는 계산 실패");
        
        // 💡 오름차순 데이터이므로 sort 필요 없음
        // chartData.sort((a, b) => a.date - b.date); 
        
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
        // 💡 오름차순('asc')으로 가져와서 reverse() 필요 없도록 수정
        const obs = await fetchFredData(series, 100, 'asc'); 
        if (obs) {
            // 💡 오름차순이므로 reverse() 제거
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
