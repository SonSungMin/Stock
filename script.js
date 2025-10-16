// script.js
import { API_KEYS } from './js/config.js';
import { fetchFredIndicators, fetchEcosIndicators } from './js/api.js';
import { analyzeIndicators, getMarketOutlook, analyzeGdpConsumption } from './js/analysis.js';
import { renderMarshallKChart, renderGdpConsumptionChart } from './js/charts.js';
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
    if (API_KEYS.FRED.includes('YOUR_APP_KEY') || API_KEYS.ECOS.includes('YOUR_APP_KEY')) {
        alert('js/config.js 파일 상단에 API 키를 먼저 입력해주세요.');
        return;
    }

    setupEventListeners();
    renderInitialPlaceholders();
    renderEconomicCalendar();
    renderReleaseSchedule();
    
    // 마샬케이, GDP/소비 차트 및 분석을 병렬로 호출
    await Promise.all([
        renderMarshallKChart(),
        renderGdpConsumptionChart(),
        analyzeGdpConsumption()
    ]);


    try {
        const [fredData, ecosData] = await Promise.all([
            fetchFredIndicators(), 
            fetchEcosIndicators()
        ]);
        
        const allIndicators = [...fredData, ...ecosData].filter(i => i && typeof i.value === 'number' && !isNaN(i.value));
        const analyzedIndicators = analyzeIndicators(allIndicators);
        
        const marketOutlook = getMarketOutlook(analyzedIndicators);
        
        renderDashboard(analyzedIndicators, marketOutlook);

    } catch (error) {
        console.error("전체 데이터 로딩 실패:", error);
        document.getElementById('update-time').innerText = "데이터 로딩에 실패했습니다.";
    }
}
