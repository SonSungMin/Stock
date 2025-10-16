// script.js
import { API_KEYS } from './js/config.js';
import { fetchFredIndicators, fetchEcosIndicators } from './js/api.js';
import { analyzeIndicators, getMarketOutlook, analyzeGdpConsumption } from './js/analysis.js';
import { renderMarshallKChart, renderGdpConsumptionChart, renderGdpGapChart } from './js/charts.js'; // 💡 renderGdpGapChart import
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

    setupEventListeners();
    renderInitialPlaceholders();
    renderEconomicCalendar();
    renderReleaseSchedule();
    
    // 💡 변경된 부분: 3개의 차트를 병렬로 로딩
    await Promise.all([
        renderMarshallKChart(),
        renderGdpConsumptionChart(),
        renderGdpGapChart(), // 💡 GDP 갭 차트 렌더링 함수 호출
        analyzeGdpConsumption()
    ]);

    try {
        const [fredData, ecosData] = await Promise.all([
            fetchFredIndicators(), 
            fetchEcosIndicators()
        ]);
        
        const allIndicators = [...fredData, ...ecosData].filter(Boolean);
        const analyzedIndicators = analyzeIndicators(allIndicators);
        const marketOutlook = getMarketOutlook(analyzedIndicators);
        
        renderDashboard(analyzedIndicators, marketOutlook);

    } catch (error) {
        console.error("전체 데이터 로딩 실패:", error);
        document.getElementById('update-time').innerText = "데이터 로딩에 실패했습니다.";
    }
}
