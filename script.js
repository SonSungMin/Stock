// script.js
import { API_KEYS } from './js/config.js';
import { fetchFredIndicators, fetchEcosIndicators } from './js/api.js';
import { 
    analyzeIndicators, 
    getMarketOutlook, 
    analyzeMarshallKTrend, 
    analyzeGdpConsumption, 
    analyzeGdpGap,
    analyzeCycleIndicators,
    getSP500Outlook // 💡 [추가]
} from './js/analysis.js';
import { 
    renderMarshallKChart, 
    renderGdpConsumptionChart, 
    renderGdpGapChart,
    renderCycleChart 
} from './js/charts.js';
import {
    renderInitialPlaceholders,
    renderDashboard,
    setupEventListeners 
} from './js/ui.js';

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
        const [
            fredData,
            ecosData,
            marshallKData,
            gdpConsumptionData,
            gdpGapData,
            cycleData 
        ] = await Promise.all([
            fetchFredIndicators(),
            fetchEcosIndicators(),
            renderMarshallKChart(),      
            renderGdpConsumptionChart(), 
            renderGdpGapChart(),
            renderCycleChart() 
        ]);

        // --- 2. 분석 실행 단계 ---
        if (marshallKData) analyzeMarshallKTrend(marshallKData, macroAnalysisResults);
        if (gdpConsumptionData) analyzeGdpConsumption(gdpConsumptionData.gdp, gdpConsumptionData.pce, macroAnalysisResults); // 수정: API 응답 구조 고려
        if (gdpGapData) analyzeGdpGap(gdpGapData, macroAnalysisResults); 
        if (cycleData) analyzeCycleIndicators(cycleData, macroAnalysisResults); 

        const allIndicators = [...fredData, ...ecosData].filter(Boolean);
        const analyzedIndicators = analyzeIndicators(allIndicators);

        // --- 3. 최종 종합 및 렌더링 단계 ---
        const marketOutlook = getMarketOutlook(analyzedIndicators, macroAnalysisResults);
        const sp500Outlook = getSP500Outlook(analyzedIndicators); // 💡 [추가] S&P 500 예측 실행

        renderDashboard(analyzedIndicators, marketOutlook);
        renderSP500Prediction(sp500Outlook); // 💡 [추가] S&P 500 예측 결과 렌더링

    } catch (error) {
        console.error("전체 데이터 로딩 또는 분석 실패:", error);
        document.getElementById('update-time').innerText = "데이터 로딩/분석 중 오류가 발생했습니다.";
        
        // 오류 발생 시에도 부분 결과 렌더링 시도
        const partialOutlook = getMarketOutlook([], macroAnalysisResults);
        renderDashboard([], partialOutlook);
        // S&P 500 예측은 데이터 부족으로 실패할 가능성이 높음
        renderSP500Prediction({ status: 'neutral', signal: '❓', title: '예측 불가', analysis: '데이터 로딩 오류로 S&P 500 전망 예측에 실패했습니다.' });
    }
}

// ==================================================================
// 💡 [신규 추가] S&P 500 예측 결과 렌더링 함수
// ==================================================================
function renderSP500Prediction(sp500Outlook) {
    const section = document.getElementById('sp500-prediction-section');
    if (!section) return;

    if (sp500Outlook && sp500Outlook.status) {
        section.className = `outlook-section ${sp500Outlook.status}-bg`; // 종합 전망과 동일한 스타일 적용
        section.innerHTML = `
            <div class="outlook-signal">${sp500Outlook.signal}</div>
            <h3 class="outlook-title ${sp500Outlook.status}-text">${sp500Outlook.title}</h3>
            <p class="outlook-analysis" style="text-align: center;">${sp500Outlook.analysis}</p> 
        `;
    } else {
        // 기본 상태 또는 오류 시
        section.className = 'outlook-section neutral-bg';
        section.innerHTML = `
            <div class="outlook-signal">❓</div>
            <h3 class="outlook-title neutral-text">예측 데이터 부족</h3>
            <p class="outlook-analysis" style="text-align: center;">S&P 500 전망을 예측하기 위한 데이터가 부족합니다.</p>
        `;
    }
}
