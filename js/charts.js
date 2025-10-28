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

// [수정] 주요 경기 침체 기간과 명칭 정의 (년도 추가)
const recessionPeriods = {
    '1973-11-01': '(1973) 오일 쇼크',
    '1980-01-01': '(1980) 더블 딥 침체',
    '1990-07-01': '(1990) 걸프전 침체',
    '2001-03-01': '(2001) IT 버블',
    '2007-12-01': '(2007) 금융위기',
    '2020-02-01': '(2020) 팬데믹'
};

// [수정] 미국 대통령 취임일 (우파: R, 좌파: D) (년도 추가)
const presidentialInaugurations = {
    '1957-01-20': '(1957) Eisenhower (R)', // S&P 500 데이터 시작점 이후
    '1961-01-20': '(1961) Kennedy (D)',
    '1963-11-22': '(1963) Johnson (D)', // 승계
    '1969-01-20': '(1969) Nixon (R)',
    '1974-08-09': '(1974) Ford (R)', // 승계
    '1977-01-20': '(1977) Carter (D)',
    '1981-01-20': '(1981) Reagan (R)',
    '1989-01-20': '(1989) Bush Sr. (R)',
    '1993-01-20': '(1993) Clinton (D)',
    '2001-01-20': '(2001) Bush Jr. (R)',
    '2009-01-20': '(2009) Obama (D)',
    '2017-01-20': '(2017) Trump (R)',
    '2021-01-20': '(2021) Biden (D)',
    '2024-11-05': '(2024) Trump (R)'
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

/**
 * [신규 추가]
 * 대통령 취임일 '레이블' 어노테이션을 생성합니다.
 */
function createPresidentialLabels(chartData) {
    return Object.entries(presidentialInaugurations).map(([date, label]) => {
        const eventDate = new Date(date);
        // chartData는 { date: 'YYYY-MM-DD', ... } 객체의 배열
        const index = chartData.findIndex(d => new Date(d.date) >= eventDate);
        if (index === -1) return null;

        const isDemocrat = label.includes('(D)');
        const color = isDemocrat ? 'rgba(0, 86, 179, 0.7)' : 'rgba(220, 53, 69, 0.7)'; // 민주당(좌) 파랑, 공화당(우) 빨강
        // [수정] Y위치 고정: 위기(10), 공화당(50), 민주당(90)
        const yAdjust = isDemocrat ? 90 : 50; 

        return { 
            type: 'line', 
            scaleID: 'x', 
            value: index, 
            borderColor: color, 
            borderWidth: 1.5, 
            borderDash: [6, 6], // [수정] 경제 위기 라인과 동일한 스타일 
            label: { 
                content: label, 
                display: true, 
                position: 'start', 
                yAdjust: yAdjust, 
                font: { size: 10, weight: 'bold' }, 
                color: 'white', 
                backgroundColor: color
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
        // [오류 수정] limit: 10000, sortOrder: 'asc' (시간순)
        const [gdpObs, usrecObs, sp500Obs] = await Promise.all([
            fetchFredData('GDPC1', 10000, 'asc', null, null, '1947-01-01'), // ✅ 수정: 전체 기간
            fetchFredData('USRECQ', 10000, 'asc', null, null, '1947-01-01'), // ✅ 수정: 전체 기간
            fetchFredData('SP500', 10000, 'asc', 'q', 'eop', '2000-01-01') // ✅ 수정: 2000년부터
        ]);

        console.log("--- [Debug] GDP 갭 차트용 S&P 500 (분기별) 데이터 ---");
        if (sp500Obs && sp500Obs.length > 0) {
            console.log(`[OK] 총 ${sp500Obs.length}개의 분기별 데이터가 로드되었습니다.`);
            console.log("첫 번째 데이터 (시작 분기):", sp500Obs[0]);
        } else {
            console.error("[Error] GDP 갭 차트용 S&P 500 데이터를 받지 못했습니다.", sp500Obs);
        }
        
        //if (!gdpObs || !usrecObs) throw new Error("실질 GDP 또는 경기 침체 데이터를 가져오지 못했습니다.");

        const gdpData = gdpObs.map(d => parseFloat(d.value));
        const labels = gdpObs.map(d => d.date);
        const usrecMap = new Map(usrecObs.map(d => [d.date, d.value === '1']));
        const sp500Map = sp500Obs ? new Map(sp500Obs.map(d => [d.date, parseFloat(d.value)])) : new Map();

        const trendData = hpfilter(gdpData, 1600);
        const gdpGapDataValues = gdpData.map((actual, i) => trendData[i] !== 0 ? ((actual / trendData[i]) - 1) * 100 : 0);
        
        const chartData = labels.map((date, index) => ({
            date: date,
            value: gdpGapDataValues[index],
            isRecession: usrecMap.get(date) || false,
            sp500Level: sp500Map.get(date) || null 
        }));

        const recessionBoxes = createRecessionBoxes(chartData);
        const recessionLabels = createRecessionLabels(chartData);
        const combinedAnnotations = [...recessionBoxes, ...recessionLabels];

        gdpGapChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'GDP 갭 (%)',
                        data: chartData.map(d => d.value),
                        backgroundColor: chartData.map(d => d.value >= 0 ? 'rgba(220, 53, 69, 0.7)' : 'rgba(0, 86, 179, 0.7)'),
                        yAxisID: 'y'
                    },
                    {
                        label: 'S&P 500 지수 (우측 축)',
                        data: chartData.map(d => d.sp500Level),
                        borderColor: '#dc3545',
                        borderWidth: 2.5,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        yAxisID: 'y1',
                        type: 'line' 
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            callback: function(value, index, ticks) {
                                const label = this.getLabelForValue(value);
                                if (!label) return null;
                                const year = parseInt(label.substring(0, 4));
                                
                                if (year % 5 === 0 && label.substring(5, 10) === '01-01') { 
                                    return year; 
                                }
                                return null;
                            },
                            autoSkip: false,
                            maxRotation: 0
                        }
                    },
                    y: { 
                        position: 'left',
                        title: { display: true, text: 'GDP 갭 (%)' } 
                    },
                    y1: {
                        position: 'right',
                        title: { display: true, text: 'S&P 500 지수' },
                        grid: { drawOnChartArea: false }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' }, 
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

export async function renderGdpConsumptionChart() {
    const canvas = document.getElementById('gdp-consumption-chart');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (gdpConsumptionChart) gdpConsumptionChart.destroy();
    try {
        // [오류 수정] limit: 10000, sortOrder: 'asc' (시간순)
        const [gdpObs, pceObs, usrecObs, sp500Obs] = await Promise.all([
             fetchFredData('GDPC1', 10000, 'asc', null, null, '1947-01-01'), // ✅ 수정: 전체 기간
             fetchFredData('PCEC', 10000, 'asc', null, null, '1947-01-01'), // ✅ 수정: 전체 기간
             fetchFredData('USRECQ', 10000, 'asc', null, null, '1947-01-01'), // ✅ 수정: 전체 기간
             fetchFredData('SP500', 10000, 'asc', 'q', 'eop', '2000-01-01') // ✅ 수정: 2000년부터
        ]);

        console.log("--- [Debug] 소비/GDP 차트용 S&P 500 (분기별) 데이터 ---");
        if (sp500Obs && sp500Obs.length > 0) {
            console.log(`[OK] 총 ${sp500Obs.length}개의 분기별 데이터가 로드되었습니다.`);
            console.log("첫 번째 데이터 (시작 분기):", sp500Obs[0]);
        } else {
            console.error("[Error] 소비/GDP 차트용 S&P 500 데이터를 받지 못했습니다.", sp500Obs);
        }
        
        const chartData = [];
        const gdpMap = new Map(gdpObs.map(d => [d.date, parseFloat(d.value)]));
        const pceMap = new Map(pceObs.map(d => [d.date, parseFloat(d.value)]));
        const usrecMap = new Map(usrecObs.map(d => [d.date, d.value === '1']));
        const sp500Map = sp500Obs ? new Map(sp500Obs.map(d => [d.date, parseFloat(d.value)])) : new Map();
        
        const uniqueDates = gdpObs.map(d => d.date); 

        for (let i = 0; i < uniqueDates.length; i++) {
            const currentDate = uniqueDates[i];
            
            let gdpGrowth = null;
            let pceGrowth = null;

            if (i >= 4) {
                const previousDate = uniqueDates[i - 4];
                const currentGdp = gdpMap.get(currentDate), prevGdp = gdpMap.get(previousDate);
                gdpGrowth = (currentGdp && prevGdp) ? ((currentGdp / prevGdp) - 1) * 100 : null;

                const currentPce = pceMap.get(currentDate), prevPce = pceMap.get(previousDate);
                pceGrowth = (currentPce && prevPce) ? ((currentPce / prevPce) - 1) * 100 : null;
            }

            const currentSp500 = sp500Map.get(currentDate); 
            const sp500Level = (currentSp500 !== undefined && !isNaN(currentSp500)) ? currentSp500 : null; 
            
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
                        borderColor: '#dc3545', 
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
                                if (!label) return null;
                                const year = parseInt(label.substring(0, 4));
                                if (year % 5 === 0 && label.substring(5, 10) === '01-01') { 
                                    return year; 
                                }
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
                        grid: { drawOnChartArea: false },
                        min: 0,    
                        max: 8000  
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
        // [수정] observation_start 추가로 1947년부터 모든 데이터 가져오기
        const [gdpSeries, m2Series, rateSeries] = await Promise.all([
             fetchFredData('GDP', 100000, 'asc', null, null, '1947-01-01'), 
             fetchFredData('M2SL', 100000, 'asc', null, null, '1947-01-01'), 
             fetchFredData('DGS10', 100000, 'asc', null, null, '1962-01-01') 
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
        // [오류 수정] .reverse() 제거. 'asc'로 가져왔으므로 순서대로 처리
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
                            // [오류 수정] 5년 단위 + Q1 레이블 확인 (사용자/클로드 제안)
                            callback: function(value, index, ticks) {
                                const data = chartData[index];
                                if (!data) return null; 
                                const year = data.year;
                                
                                const quarter = parseInt(data.label.split(' Q')[1]); 

                                if (year % 5 === 0 && quarter === 1) {
                                    return year;
                                }
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
        const obs = await fetchFredData(series, 100, 'asc', null, null, null); 
        if (obs) {
            const historicalData = obs.map(d => ({date: d.date, value: parseFloat(d.value)})); 
            if (historicalData.length > 0 && historicalData.some(d => d.value !== null && !isNaN(d.value))) { 
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
        const cycleData = await fetchEcosCycleData();
        if (!cycleData || !cycleData.coincident || !cycleData.leading) {
             throw new Error("경기 순환 데이터가 없습니다.");
        }
        
        const coincident = cycleData.coincident.map(d => ({ date: d.TIME, value: parseFloat(d.DATA_VALUE) }));
        const leading = cycleData.leading.map(d => ({ date: d.TIME, value: parseFloat(d.DATA_VALUE) }));
        
        const labels = coincident.map(d => `${d.date.substring(0,4)}-${d.date.substring(4,6)}`);
        const coincidentValues = coincident.map(d => d.value);
        
        const leadingMap = new Map(leading.map(d => [d.date, d.value]));
        const leadingValues = coincident.map(d => leadingMap.get(d.date) || null); 

        const chartDataForLabels = coincident.map(d => ({ 
            date: `${d.date.substring(0, 4)}-${d.date.substring(4, 6)}-01` 
        }));
        const recessionLabels = createRecessionLabels(chartDataForLabels);

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
 * S&P 500 추세 차트 렌더링 (2000년 이후)
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
        console.warn("No S&P 500 data available for trend chart.");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillText("S&P 500 데이터 로딩 실패", canvas.width / 2, canvas.height / 2);
        return;
    }

    // [수정] 2000년 1월 1일 이후 데이터만 필터링
    const validData = sp500Data.filter(d => {
        if (d.value === '.') return false;
        const date = new Date(d.date);
        return date >= new Date('2000-01-01');
    });
    
    if (validData.length === 0) {
        console.warn("No S&P 500 data available after 2000.");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillText("2000년 이후 데이터 없음", canvas.width / 2, canvas.height / 2);
        return;
    }

    const labels = validData.map(d => d.date);
    const prices = validData.map(d => parseFloat(d.value));

    // [수정] 2000년 이후 어노테이션만 생성
    const recessionLabels = createRecessionLabels(validData);
    const presidentLabels = createPresidentialLabels(validData);
    const combinedAnnotations = [...recessionLabels, ...presidentLabels];

    // [수정] 2000년 이후 이벤트 연도만 추출
    const eventYears = new Set();
    Object.keys(recessionPeriods).forEach(date => {
        const year = date.substring(0, 4);
        if (parseInt(year) >= 2000) eventYears.add(year);
    });
    Object.keys(presidentialInaugurations).forEach(date => {
        const year = date.substring(0, 4);
        if (parseInt(year) >= 2000) eventYears.add(year);
    });

    sp500TrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'S&P 500 지수',
                data: prices,
                borderColor: '#dc3545', 
                borderWidth: 1.5,
                pointRadius: 0, 
                tension: 0.1
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
                            if (!label) return null;
                            
                            const year = label.substring(0, 4);
                            const prevLabel = this.getLabelForValue(value - 1);
                            const prevYear = (typeof prevLabel === 'string') ? prevLabel.substring(0, 4) : null;

                            // 💡 [수정] 이전 눈금과 연도가 다르면 항상 연도를 표시하도록 단순화
                            if (year !== prevYear) {
                                return year;
                            }
                            return null;
                        },
                        autoSkip: false,
                        maxRotation: 0
                    }
                },
                y: {
                    title: { display: false } 
                }
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
}
