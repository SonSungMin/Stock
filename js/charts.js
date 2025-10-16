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


// ==================================================================
// 소비와 GDP 사이클 차트 렌더링 함수 (동적 차트)
// ==================================================================
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
        // GDPC1: Real GDP, PCEC: Real PCE (Consumption), USRECQ: US Recession Indicators (Quarterly)
        // 200개 분기 데이터 (약 50년치) 요청
        const [gdpObs, pceObs, usrecObs] = await Promise.all([
            fetchFredData('GDPC1', 200, 'desc'), 
            fetchFredData('PCEC', 200, 'desc'),   
            fetchFredData('USRECQ', 200, 'desc') // <<< 수정된 부분
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
                        // <<< 수정된 부분: min, max 삭제
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
export async function renderMarshallKChart() {
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
                        tension
