// script.js
import { API_KEYS } from './js/config.js';
import { fetchFredIndicators, fetchEcosIndicators } from './js/api.js';
import { 
    analyzeIndicators, 
    getMarketOutlook, 
    analyzeMarshallKTrend, 
    analyzeGdpConsumption, 
    analyzeGdpGap 
} from './js/analysis.js';
import { 
    renderMarshallKChart, 
    renderGdpConsumptionChart, 
    renderGdpGapChart 
} from './js/charts.js';
import {
    renderInitialPlaceholders,
    renderDashboard,
    renderEconomicCalendar,
    renderReleaseSchedule,
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

    // 모든 거시 경제 분석 결과를 저장할 중앙 객체
    const macroAnalysisResults = {
        marshallK: null,
        gdpGap: null,
        gdpConsumption: null
    };

    // UI 기본 설정 초기화
    setupEventListeners();
    renderInitialPlaceholders();
    renderEconomicCalendar();
    renderReleaseSchedule();

    try {
        // --- 1. 데이터 로딩 단계 ---
        // 모든 단기 지표와 거시 경제 데이터를 병렬로 최대한 빠르게 불러옵니다.
        const [
            fredData,
            ecosData,
            marshallKData,
            gdpConsumptionData,
            gdpGapData
        ] = await Promise.all([
            fetchFredIndicators(),
            fetchEcosIndicators(),
            renderMarshallKChart(),      // 차트를 그리고 분석에 필요한 데이터를 반환합니다.
            renderGdpConsumptionChart(), // 차트를 그리고 분석에 필요한 데이터를 반환합니다.
            renderGdpGapChart()          // 차트를 그리고 분석에 필요한 데이터를 반환합니다.
        ]);

        // --- 2. 분석 실행 단계 ---
        // 데이터 로딩이 모두 완료된 것을 확인한 후, 분석을 순차적으로 실행합니다.
        // 각 분석 함수는 결과를 macroAnalysisResults 객체에 저장합니다.
        if (marshallKData) analyzeMarshallKTrend(marshallKData, macroAnalysisResults);
        if (gdpConsumptionData) analyzeGdpConsumption(gdpConsumptionData.gdp, gdpConsumptionData.pce, macroAnalysisResults);
        if (gdpGapData) analyzeGdpGap(gdpGapData, macroAnalysisResults);

        const allIndicators = [...fredData, ...ecosData].filter(Boolean);
        const analyzedIndicators = analyzeIndicators(allIndicators);

        // --- 3. 최종 종합 및 렌더링 단계 ---
        // 모든 단기/장기 분석이 완료된 후, 최종 시장 전망을 생성합니다.
        const marketOutlook = getMarketOutlook(analyzedIndicators, macroAnalysisResults);
        
        // 최종 결과를 화면에 표시합니다.
        renderDashboard(analyzedIndicators, marketOutlook);

    } catch (error) {
        console.error("전체 데이터 로딩 또는 분석 실패:", error);
        document.getElementById('update-time').innerText = "데이터 로딩/분석 중 오류가 발생했습니다.";
        
        // 오류가 발생하더라도, 분석된 부분까지만이라도 화면에 표시를 시도합니다.
        const partialOutlook = getMarketOutlook([], macroAnalysisResults);
        renderDashboard([], partialOutlook);
    }
}
