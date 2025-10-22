// script.js
import { API_KEYS } from './js/config.js';
// [수정] fetchRecentSP500Data 추가
import { fetchFredIndicators, fetchEcosIndicators, fetchRecentSP500Data } from './js/api.js';
import {
    analyzeIndicators,
    getMarketOutlook,
    analyzeMarshallKTrend,
    analyzeGdpConsumption,
    analyzeGdpGap,
    analyzeCycleIndicators,
    getSP500Outlook // [추가]
} from './js/analysis.js';
import {
    renderMarshallKChart,
    renderGdpConsumptionChart,
    renderGdpGapChart,
    renderCycleChart,
    renderSP500TrendChart // [추가]
} from './js/charts.js';
import {
    renderInitialPlaceholders,
    renderDashboard,
    setupEventListeners
} from './js/ui.js';
// 💡 indicators.js import 추가 (renderSP500Prediction에서 사용)
import { indicatorDetails } from './js/indicators.js';

// ==================================================================
// 초기 실행 함수 (main)
// ==================================================================
document.addEventListener('DOMContentLoaded', main);

async function main() {
    if (API_KEYS.FRED.includes('YOUR') || API_KEYS.ECOS.includes('YOUR')) {
        alert('js/config.js 파일에 API 키를 먼저 입력해주세요.');
        return;
    }

    const macroAnalysisResults = {
        marshallK: null,
        gdpGap: null,
        gdpConsumption: null,
        cycle: null
    };

    setupEventListeners();
    renderInitialPlaceholders();

    try {
        // --- 1. 데이터 로딩 단계 ---
        // [수정] fetchRecentSP500Data 추가
        const [
            fredData,
            ecosData,
            marshallKData,
            gdpConsumptionData,
            gdpGapData,
            cycleData,
            recentSP500Data // [추가]
        ] = await Promise.all([
            fetchFredIndicators(),
            fetchEcosIndicators(),
            renderMarshallKChart(),
            renderGdpConsumptionChart(),
            renderGdpGapChart(),
            renderCycleChart(),
            fetchRecentSP500Data() // [추가]
        ]);

        // --- 2. 분석 실행 단계 ---
        if (marshallKData) analyzeMarshallKTrend(marshallKData, macroAnalysisResults);
        // gdpConsumptionData가 null이 아닐 때만 gdp, pce 속성 접근
        if (gdpConsumptionData) analyzeGdpConsumption(gdpConsumptionData.gdp, gdpConsumptionData.pce, macroAnalysisResults);
        if (gdpGapData) analyzeGdpGap(gdpGapData, macroAnalysisResults);
        if (cycleData) analyzeCycleIndicators(cycleData, macroAnalysisResults);

        const allIndicators = [...fredData, ...ecosData].filter(Boolean);
        const analyzedIndicators = analyzeIndicators(allIndicators);

        // --- 3. 최종 종합 및 렌더링 단계 ---
        const marketOutlook = getMarketOutlook(analyzedIndicators, macroAnalysisResults);
        const sp500Outlook = getSP500Outlook(analyzedIndicators); // S&P 500 예측 실행

        renderDashboard(analyzedIndicators, marketOutlook);
        // [수정] analyzedIndicators와 recentSP500Data 전달
        renderSP500Prediction(sp500Outlook, analyzedIndicators, recentSP500Data);

    } catch (error) {
        console.error("전체 데이터 로딩 또는 분석 실패:", error);
        document.getElementById('update-time').innerText = "데이터 로딩/분석 중 오류가 발생했습니다.";

        // 오류 발생 시에도 부분 결과 렌더링 시도
        const partialOutlook = getMarketOutlook([], macroAnalysisResults);
        renderDashboard([], partialOutlook);
        // S&P 500 예측은 데이터 부족으로 실패할 가능성이 높음
        renderSP500Prediction({ status: 'neutral', signal: '❓', title: '예측 불가', analysis: '데이터 로딩 오류로 S&P 500 전망 예측에 실패했습니다.' }, [], null); // 수정
    }
}

// ==================================================================
// [신규 추가] S&P 500 예측 결과 렌더링 함수
// ==================================================================
/**
 * S&P 500 예측 결과, 근거 지표 테이블, 최근 추세 차트를 렌더링합니다.
 * @param {object} sp500Outlook - getSP500Outlook 결과
 * @param {object[]} analyzedIndicators - 모든 분석된 지표 데이터
 * @param {object[]|null} recentSP500Data - 최근 3년 S&P 500 데이터 (api.js)
 */
function renderSP500Prediction(sp500Outlook, analyzedIndicators, recentSP500Data) {
    const section = document.getElementById('sp500-prediction-section');
    const tableBody = document.querySelector('#sp500-factors-table tbody');
    if (!section || !tableBody) {
         console.error("Required elements for S&P 500 prediction not found.");
         return;
    }

    // 1. 예측 결과 텍스트 렌더링
    if (sp500Outlook && sp500Outlook.status) {
        section.className = `outlook-section ${sp500Outlook.status}-bg`;
        section.innerHTML = `
            <div class="outlook-signal">${sp500Outlook.signal}</div>
            <h3 class="outlook-title ${sp500Outlook.status}-text">${sp500Outlook.title}</h3>
            <p class="outlook-analysis" style="text-align: center;">${sp500Outlook.analysis}</p>
        `;
    } else {
        section.className = 'outlook-section neutral-bg';
        section.innerHTML = `
            <div class="outlook-signal">❓</div>
            <h3 class="outlook-title neutral-text">예측 데이터 부족</h3>
            <p class="outlook-analysis" style="text-align: center;">S&P 500 전망을 예측하기 위한 데이터가 부족합니다.</p>
        `;
    }

    // 2. 근거 지표 테이블 채우기
    tableBody.innerHTML = ''; // 기존 내용 삭제
    const factorIds = ['ism_pmi', 'consumer_sentiment', 'yield_spread', 'copper_price'];
    let factorsFoundCount = 0;

    factorIds.forEach(id => {
        const indicator = analyzedIndicators.find(ind => ind && ind.id === id); // null 체크 추가
        const row = tableBody.insertRow();
        const cellName = row.insertCell();
        const cellValue = row.insertCell();
        const cellDate = row.insertCell(); // [신규 추가]
        const cellStatus = row.insertCell();

        cellName.style.padding = '8px';
        cellName.style.border = '1px solid #dee2e6';
        cellValue.style.padding = '8px';
        cellValue.style.border = '1px solid #dee2e6';
        cellValue.style.textAlign = 'right';
        
        // [신규 추가] 날짜 셀 스타일
        cellDate.style.padding = '8px';
        cellDate.style.border = '1px solid #dee2e6';
        cellDate.style.textAlign = 'left';
        cellDate.style.fontSize = '0.9em';
        cellDate.style.color = '#6c757d';

        cellStatus.style.padding = '8px';
        cellStatus.style.border = '1px solid #dee2e6';
        cellStatus.style.textAlign = 'center';

        if (indicator) {
            factorsFoundCount++;
            cellName.textContent = indicator.name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim();
            cellValue.textContent = `${indicator.value.toLocaleString()}${indicator.unit || ''}`;
            cellDate.textContent = indicator.date || 'N/A'; // [신규 추가]
            cellStatus.innerHTML = `<span class="status-icon ${indicator.status}-icon">${indicator.icon}</span> ${indicator.text}`;
             if (indicator.status === 'positive') row.style.backgroundColor = '#d4edda4d';
             else if (indicator.status === 'negative') row.style.backgroundColor = '#f8d7da4d';
        } else {
            // indicatorDetails를 사용하여 기본 정보 표시
            const details = indicatorDetails[id];
            cellName.textContent = details ? details.title.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim() : id;
            cellValue.textContent = 'N/A';
            cellDate.textContent = 'N/A'; // [신규 추가]
            cellStatus.innerHTML = `<span class="status-icon neutral-icon">❓</span> 데이터 없음`;
            row.style.color = '#6c757d';
        }
    });

    // 테이블 메시지 처리
     if (factorsFoundCount === 0 && analyzedIndicators.length > 0) {
         tableBody.innerHTML = '<tr><td colspan="4" class="loading-text" style="padding: 10px;">예측 근거 지표 데이터를 불러오지 못했습니다.</td></tr>';
    } else if (analyzedIndicators.length === 0 && factorsFoundCount === 0) {
        // analyzedIndicators 자체가 비어있으면 (초기 로딩 실패)
         tableBody.innerHTML = '<tr><td colspan="4" class="loading-text" style="padding: 10px;">전체 지표 로딩 실패</td></tr>';
    }


    // 3. 최근 S&P 500 추세 차트 렌더링
    renderSP500TrendChart(recentSP500Data);
}
