// script.js
import { API_KEYS } from './js/config.js';
import { fetchFredIndicators, fetchEcosIndicators } from './js/api.js';
import { analyzeIndicators, getMarketOutlook, analyzeMarshallKTrend, analyzeGdpConsumption, analyzeGdpGap } from './js/analysis.js';
import { renderMarshallKChart, renderGdpConsumptionChart, renderGdpGapChart } from './js/charts.js';
import {
    renderInitialPlaceholders,
    renderDashboard,
    renderEconomicCalendar,
    renderReleaseSchedule,
    setupEventListeners
} from './js/ui.js';

// ==================================================================
// 초기 실행 함수
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
        gdpConsumption: null
    };

    setupEventListeners();
    renderInitialPlaceholders();
    renderEconomicCalendar();
    renderReleaseSchedule();

    try {
        // 1. 단기 지표와 거시 경제 데이터를 병렬로 로딩
        const [
            fredData,
            ecosData,
            marshallKData,
            gdpConsumptionData,
            gdpGapData
        ] = await Promise.all([
            fetchFredIndicators(),
            fetchEcosIndicators(),
            renderMarshallKChart(),      // 차트 렌더링 + 데이터 반환
            renderGdpConsumptionChart(), // 차트 렌더링 + 데이터 반환
            renderGdpGapChart()          // 차트 렌더링 + 데이터 반환
        ]);

        // 2. 데이터 로딩이 완료된 후, 분석을 순차적으로 실행
        if (marshallKData) analyzeMarshallKTrend(marshallKData, macroAnalysisResults);
        if (gdpConsumptionData) analyzeGdpConsumption(gdpConsumptionData.gdp, gdpConsumptionData.pce, macroAnalysisResults);
        if (gdpGapData) analyzeGdpGap(gdpGapData, macroAnalysisResults);

        const allIndicators = [...fredData, ...ecosData].filter(Boolean);
        const analyzedIndicators = analyzeIndicators(allIndicators);

        // 3. 모든 분석이 끝난 후, 종합 전망 생성
        //const marketOutlook = getMarketOutlook(analyzedIndicators, macroAnalysisResults);
        const marketOutlook = getDetailedMarketOutlook(analyzedIndicators, macroAnalysisResults);
        renderDashboard(analyzedIndicators, marketOutlook);

    } catch (error) {
        console.error("전체 데이터 로딩 또는 분석 실패:", error);
        document.getElementById('update-time').innerText = "데이터 로딩/분석에 실패했습니다.";
        // 일부 차트가 실패해도 UI는 기본값으로 렌더링 시도
        const outlook = getMarketOutlook([], macroAnalysisResults);
        renderDashboard([], outlook);
    }
}
