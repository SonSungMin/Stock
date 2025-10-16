// script.js (index.html과 같은 위치에 있어야 합니다)

import { API_KEYS } from './js/config.js';
import { fetchFredIndicators, fetchEcosIndicators } from './js/api.js';
import { analyzeIndicators, getMarketOutlook } from './js/analysis.js';
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

    // 거시 분석 결과를 저장할 객체 생성
    const macroAnalysisResults = {
        marshallK: null,
        gdpGap: null,
        gdpConsumption: null
    };

    setupEventListeners();
    renderInitialPlaceholders();
    renderEconomicCalendar();
    renderReleaseSchedule();
    
    // 거시 경제 차트 렌더링과 분석을 병렬로 실행합니다.
    const macroAnalysisPromise = Promise.all([
        renderMarshallKChart(macroAnalysisResults),
        renderGdpConsumptionChart(macroAnalysisResults),
        renderGdpGapChart(macroAnalysisResults),
    ]);

    try {
        // 단기 지표 데이터 로딩
        const [fredData, ecosData] = await Promise.all([
            fetchFredIndicators(), 
            fetchEcosIndicators()
        ]);
        
        const allIndicators = [...fredData, ...ecosData].filter(Boolean);
        const analyzedIndicators = analyzeIndicators(allIndicators);
        
        // 거시 경제 분석이 모두 완료될 때까지 기다립니다.
        await macroAnalysisPromise;
        
        // 단기 지표와 거시 분석 결과를 모두 전달하여 종합 전망을 생성합니다.
        const marketOutlook = getMarketOutlook(analyzedIndicators, macroAnalysisResults);
        
        renderDashboard(analyzedIndicators, marketOutlook);

    } catch (error) {
        console.error("전체 데이터 로딩 실패:", error);
        document.getElementById('update-time').innerText = "데이터 로딩에 실패했습니다.";
    }
}
