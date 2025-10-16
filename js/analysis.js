// js/analysis.js

// ==================================================================
// 데이터 분석 및 가공 함수
// ==================================================================
export function analyzeIndicators(indicators) {
    // 이 함수는 이전과 동일하게 각 지표를 개별적으로 분석합니다.
    return indicators.map(indicator => {
        const { id, value } = indicator;
        let status = 'neutral', icon = '😐', text = '보통', weight = 2;
        switch (id) {
            case 'yield_spread':
                if (value >= 0.1) { status = 'positive'; icon = '✅'; text = '정상 범위'; } 
                else if (value > -0.2) { status = 'neutral'; icon = '⚠️'; text = '역전 우려'; } 
                else { status = 'negative'; icon = '🚨'; text = '침체 신호'; }
                weight = 5; break;
            case 'exchange_rate':
                if (value <= 1300) { status = 'positive'; icon = '💵'; text = '환율 안정'; }
                else if (value <= 1380) { status = 'neutral'; icon = '〰️'; text = '변동성 확대'; }
                else { status = 'negative'; icon = '💸'; text = '원화 약세'; }
                weight = 4; break;
            case 'vix':
                if (value <= 20) { status = 'positive'; icon = '😌'; text = '시장 안정'; }
                else if (value <= 30) { status = 'neutral'; icon = '😟'; text = '불안 심리'; }
                else { status = 'negative'; icon = '😱'; text = '공포 심리'; }
                weight = 4; break;
            case 'us_cpi':
                if (value <= 2.5) { status = 'positive'; icon = '😌'; text = '물가 안정'; }
                else if (value <= 3.5) { status = 'neutral'; icon = '😐'; text = '인플레 둔화'; }
                else { status = 'negative'; icon = '🔥'; text = '물가 압력'; }
                weight = 5; break;
            case 'nfp':
                if (value >= 250) { status = 'positive'; icon = '👍'; text = '고용 서프라이즈'; }
                else if (value >= 150) { status = 'neutral'; icon = '😐'; text = '예상 부합'; }
                else { status = 'negative'; icon = '👎'; text = '고용 쇼크'; }
                weight = 5; break;
            case 'gdp_growth':
                if (value >= 0.7) { status = 'positive'; icon = '👍'; text = '견조한 회복'; }
                else if (value >= 0.3) { status = 'neutral'; icon = '😐'; text = '완만한 성장'; }
                else { status = 'negative'; icon = '👎'; text = '성장 둔화'; }
                weight = 5; break;
            case 'export_growth':
                if (value >= 2.0) { status = 'positive'; icon = '📈'; text = '수출 호조'; }
                else if (value >= 0) { status = 'neutral'; icon = '📊'; text = '소폭 개선'; }
                else { status = 'negative'; icon = '📉'; text = '수출 부진'; }
                weight = 5; break;
            // ... 기타 지표들은 기존 로직 유지 ...
        }
        return { ...indicator, status, icon, text, weight };
    });
}

/**
 * 💡 [핵심 업그레이드]
 * 모든 단기/장기 지표를 종합하여 복합적인 시장 시나리오를 분석하고 구체적인 전망을 생성합니다.
 */
export function getMarketOutlook(analyzedIndicators, macroResults) {
    if (!analyzedIndicators) analyzedIndicators = [];

    // 1. 거시 경제 분석 결과 정리
    const { marshallK, gdpGap, gdpConsumption } = macroResults;
    const macroSignals = {
        isInflationary: gdpGap?.status === 'negative' && gdpGap.outlook.includes('인플레이션'),
        isRecessionary: gdpGap?.status === 'negative' && gdpGap.outlook.includes('침체'),
        isLiquidityExcess: marshallK?.status === 'negative',
        isConsumptionWeak: gdpConsumption?.status === 'negative',
        isRecovery: gdpConsumption?.status === 'positive' || marshallK?.status === 'positive',
    };

    // 2. 단기 핵심 지표 상태 확인
    const findIndicator = (id) => analyzedIndicators.find(i => i && i.id === id);
    const shortTermSignals = {
        cpi: findIndicator('us_cpi'),
        nfp: findIndicator('nfp'),
        yieldSpread: findIndicator('yield_spread'),
        vix: findIndicator('vix'),
    };

    // 3. 시나리오 분석
    let finalStatus = 'neutral', finalSignal = '📊', finalTitle = '혼조세 전망', finalAnalysis = '';
    
    // 시나리오 1: 경기 과열 또는 스태그플레이션 우려 (가장 부정적)
    if (macroSignals.isInflationary && (macroSignals.isRecessionary || shortTermSignals.yieldSpread?.status === 'negative')) {
        finalStatus = 'negative';
        finalSignal = '🔥';
        finalTitle = '스태그플레이션 우려';
        finalAnalysis = `<b>[거시 분석]</b> 잠재성장률을 상회하는 생산으로 인한 인플레이션 압력(높은 GDP 갭)과 장단기 금리차 역전 등 경기 침체 신호가 동시에 나타나고 있습니다. 이는 성장은 둔화되는데 물가는 높은 최악의 상황일 수 있습니다.<br><br><b>[단기 분석]</b> 소비자물가지수(CPI)가 여전히 높게 유지되고 있는지 주목해야 합니다. 방어적 자산 배분 전략이 시급합니다.`;
    }
    // 시나리오 2: 명확한 경기 침체 신호
    else if (macroSignals.isRecessionary && shortTermSignals.yieldSpread?.status === 'negative' && macroSignals.isConsumptionWeak) {
        finalStatus = 'negative';
        finalSignal = '📉';
        finalTitle = '경기 침체 진입';
        finalAnalysis = `<b>[거시 분석]</b> 소비 둔화, 잠재성장률 하회(마이너스 GDP 갭), 장단기 금리차 역전 등 여러 지표가 일관되게 경기 침체를 가리키고 있습니다.<br><br><b>[단기 분석]</b> VIX(변동성 지수)가 급등하고 고용(NFP)이 급격히 악화될 경우 침체는 가속화될 수 있습니다. 현금 및 대표 안전자산(달러, 장기 국채) 비중을 늘려야 할 시점입니다.`;
    }
    // 시나리오 3: 건강한 경기 회복 (가장 긍정적)
    else if (macroSignals.isRecovery && shortTermSignals.cpi?.status === 'positive' && shortTermSignals.yieldSpread?.status === 'positive') {
        finalStatus = 'positive';
        finalSignal = '📈';
        finalTitle = '견조한 회복 국면';
        finalAnalysis = `<b>[거시 분석]</b> 소비와 GDP가 동반 성장하고, 유동성이 정상화되는 건강한 회복세를 보이고 있습니다.<br><br><b>[단기 분석]</b> 물가(CPI)가 안정되고, 장단기 금리차가 정상 범위를 유지하며, 고용(NFP)이 꾸준히 증가한다면 위험자산에 대한 긍정적 시각을 유지할 수 있습니다.`;
    }
    // 시나리오 4: 유동성 기반의 불안한 상승
    else if (macroSignals.isLiquidityExcess && shortTermSignals.vix?.status === 'positive') {
        finalStatus = 'neutral';
        finalSignal = '⚠️';
        finalTitle = '유동성 장세, 변동성 주의';
        finalAnalysis = `<b>[거시 분석]</b> 과잉 유동성(높은 마샬케이)이 자산 가격을 밀어 올리는 상황으로 보입니다. 이는 경제 펀더멘털보다 돈의 힘으로 움직이는 시장이므로 갑작스러운 변동성에 취약할 수 있습니다.<br><br><b>[단기 분석]</b> 현재 VIX 지수가 낮아 시장이 안정적으로 보일 수 있으나, 작은 충격에도 크게 흔들릴 수 있으므로 추격 매수는 자제하고 이익 실현을 고려해야 합니다.`;
    }
    // 시나리오 5: 일반적인 혼조세
    else {
        const positiveIndicator = analyzedIndicators.find(i => i && i.status === 'positive');
        const negativeIndicator = analyzedIndicators.find(i => i && i.status === 'negative');
        const positiveSummary = macroSignals.isRecovery ? '소비 회복 등 긍정적 거시 신호' : positiveIndicator?.name;
        const negativeSummary = macroSignals.isInflationary ? '인플레이션 압력' : (macroSignals.isConsumptionWeak ? '소비 둔화' : negativeIndicator?.name);
        
        finalAnalysis = `<b>[혼재된 신호]</b> ${positiveSummary || '일부 긍정적 지표'}와 ${negativeSummary || '일부 부정적 지표'}가 혼재되어 뚜렷한 방향성을 예측하기 어렵습니다.<br><br><b>[전략]</b> 시장이 방향성을 탐색하는 구간으로, 성장이 확인되는 특정 섹터에 선별적으로 투자하거나 관망하는 자세가 필요합니다.`;
    }

    return { status: finalStatus, signal: finalSignal, title: finalTitle, analysis: finalAnalysis };
}

// ==================================================================
// 자산군별 투자 의견 및 섹터 전망 (더 정교하게 수정)
// ==================================================================

// 투자 의견 함수는 UI 파일로 이동하는 것이 더 적합하나, 분석 로직과 강하게 결합되므로 여기에 둡니다.
export function getInvestmentSuggestions(marketOutlook) {
    const status = marketOutlook.status;
    const title = marketOutlook.title;

    if (status === 'positive') {
        return {
            '주식': { icon: '📈', outlook: '비중 확대', reason: '경기 회복 기대감으로 위험자산 선호 심리가 강화됩니다. 특히 기술주, 경기소비재 등 성장주가 유망합니다.' },
            '채권': { icon: '⚖️', outlook: '비중 유지', reason: '금리 안정화 시기에는 안정적 이자 수익 확보 차원에서 유효합니다. 단기채 위주로 구성하는 것이 좋습니다.' },
            '달러': { icon: '💵', outlook: '비중 축소', reason: '위험자산 선호 심리가 강해지면 대표 안전자산인 달러의 매력도는 감소할 수 있습니다.' },
            '원자재/금': { icon: '🛢️', outlook: '비중 확대', reason: '경기 회복은 산업용 원자재(구리 등) 수요 증가로 이어지며, 금은 인플레이션 헤지 수단으로 유효합니다.' }
        };
    } else if (status === 'negative') {
        // 스태그플레이션과 일반 침체를 구분
        if (title.includes('스태그플레이션')) {
             return {
                '주식': { icon: '📉', outlook: '비중 축소', reason: '성장 둔화와 비용 증가로 기업 이익이 크게 훼손될 수 있습니다. 필수소비재, 헬스케어 등 방어주 비중 확대가 필요합니다.' },
                '채권': { icon: '🤔', outlook: '중립 (단기채 위주)', reason: '경기 둔화는 채권에 긍정적이나, 높은 물가는 부담 요인입니다. 물가연동국채(TIPS) 또는 단기채가 대안이 될 수 있습니다.' },
                '달러': { icon: '💰', outlook: '비중 확대', reason: '글로벌 경기 불확실성이 커지면 가장 강력한 안전자산인 달러 수요가 급증합니다.' },
                '원자재/금': { icon: '✨', outlook: '비중 확대', reason: '물가 상승을 헤지할 수 있는 금과 에너지 원자재의 가치가 부각되는 시기입니다.' }
            };
        }
        return { // 일반 침체
            '주식': { icon: '📉', outlook: '비중 축소', reason: '경기 둔화 우려로 기업 실적이 악화되고 투자 심리가 위축됩니다. 현금 비중을 늘리는 것이 중요합니다.' },
            '채권': { icon: '🛡️', outlook: '비중 확대', reason: '금리 인하 기대감으로 장기 국채의 매력도가 높아지는 대표적인 시기입니다.' },
            '달러': { icon: '💰', outlook: '비중 확대', reason: '안전자산 선호 심리가 극대화되며 달러 가치가 상승할 가능성이 높습니다.' },
            '금': { icon: '✨', outlook: '비중 확대', reason: '대표적인 안전자산으로, 포트폴리오의 변동성을 낮추는 역할을 합니다.' }
        };
    } else { // neutral
         return {
            '주식': { icon: '📊', outlook: '중립 (섹터별 차별화)', reason: '시장의 방향성이 불확실하므로, 실적이 뒷받침되는 특정 섹터(예: AI, 신재생에너지) 위주의 선별적인 투자가 필요합니다.' },
            '채권': { icon: '⚖️', outlook: '비중 유지', reason: '만기가 짧은 단기 국채나 우량 등급 회사채 중심으로 안정적인 이자 수익을 추구하는 전략이 유효합니다.' },
            '달러/금': { icon: '🔄', outlook: '중립 (헷지 수단)', reason: '향후 시장 변동성에 대비하여 포트폴리오를 방어하는 헷지(위험회피) 수단으로 일부 보유하는 것을 고려할 수 있습니다.' },
            '대체투자': { icon: '🏘️', outlook: '관심 필요', reason: '주식, 채권 외의 자산(부동산, 인프라 등)으로 분산 투자하여 포트폴리오 안정성을 높일 필요가 있습니다.' }
        };
    }
}


// 아래 함수들은 기존 로직을 유지하되, 분석 결과를 UI에 표시하는 역할만 담당합니다.

export function analyzeMarshallKTrend(chartData, resultsObject) {
    const analysisDiv = document.getElementById('marshall-analysis');
    let result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '', analysis: '' };

    if (!chartData || chartData.length < 8) {
        result.analysis = '<p class="loading-text">분석할 데이터가 부족합니다.</p>';
    } else {
        const latest = chartData[chartData.length - 1];
        const avgMarshallK = chartData.reduce((sum, d) => sum + d.marshallK, 0) / chartData.length;
        
        if (latest.marshallK > avgMarshallK && latest.interestRate > 3.5) {
            result = { status: 'negative', outlook: '🚨 경기 둔화 우려', summary: '높은 금리에도 불구, 과잉 유동성이 관찰되어 경기 둔화 및 자산 버블 우려가 있습니다.' };
        } else if (latest.marshallK < chartData[chartData.length-5].marshallK && latest.interestRate < chartData[chartData.length-5].interestRate){
             result = { status: 'positive', outlook: '✅ 경기 회복 초기 신호', summary: '유동성이 정상화되고 금리가 하락하는 추세로, 경기 회복의 초기 신호일 수 있습니다.' };
        } else {
             result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '유동성과 금리가 명확한 방향성 없이 과도기적 국면에 있습니다.' };
        }
        result.analysis = `<p><strong>현재 상황:</strong> 마샬케이 ${latest.marshallK.toFixed(2)}, 10년물 금리 ${latest.interestRate.toFixed(2)}%</p><p>${result.summary}</p>`;
    }
    
    analysisDiv.innerHTML = `<div class="market-outlook-badge ${result.status}">${result.outlook}</div><div class="analysis-text">${result.analysis}</div>`;
    resultsObject.marshallK = result;
}

export function analyzeGdpConsumption(gdpObs, pceObs, resultsObject) {
    const analysisDiv = document.getElementById('gdp-consumption-analysis');
    let result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '', analysis: '' };

    try {
        if (!gdpObs || gdpObs.length < 5 || !pceObs || pceObs.length < 5) throw new Error("데이터 부족");
        
        const gdpGrowth = ((parseFloat(gdpObs[0].value) / parseFloat(gdpObs[4].value)) - 1) * 100;
        const pceGrowth = ((parseFloat(pceObs[0].value) / parseFloat(pceObs[4].value)) - 1) * 100;
        
        if (gdpGrowth > 1.5 && pceGrowth > 1.5) {
            result = { status: 'positive', outlook: '✅ 확장 국면', summary: 'GDP와 소비 모두 견조하게 상승하며 경기 확장 국면에 있습니다.' };
        } else if (gdpGrowth < 0 && pceGrowth < 0) {
            result = { status: 'negative', outlook: '🚨 경기 침체 국면', summary: 'GDP와 소비 모두 마이너스 성장하며 경기 침체에 진입했습니다.' };
        } else if (gdpGrowth > pceGrowth && gdpGrowth > 0.5) {
            result = { status: 'negative', outlook: '⚠️ 소비 둔화 우려', summary: '소비 증가율이 GDP 증가율을 하회하여 소비 둔화 우려가 커지고 있습니다.' };
        } else {
            result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '시장이 방향성을 탐색하는 중립적 국면에 있습니다.' };
        }
        result.analysis = `<p><strong>최신 데이터 (${gdpObs[0].date.substring(0,7)}):</strong></p><ul><li>실질 GDP: <strong>${gdpGrowth.toFixed(2)}%</strong></li><li>실질 PCE: <strong>${pceGrowth.toFixed(2)}%</strong></li></ul><p><strong>분석:</strong> ${result.summary}</p>`;
    } catch (error) {
        result.analysis = '<p style="color:#dc3545;">GDP/소비 데이터 분석에 실패했습니다.</p>';
    }

    analysisDiv.innerHTML = `<div class="market-outlook-badge ${result.status}">${result.outlook}</div><div class="analysis-text">${result.analysis}</div>`;
    resultsObject.gdpConsumption = result;
}

export function analyzeGdpGap(gdpGapData, resultsObject) {
    const analysisDiv = document.getElementById('gdp-gap-analysis');
    let result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '', analysis: '' };

    if (!gdpGapData || gdpGapData.length < 2) {
        result.analysis = '<p class="loading-text">분석할 데이터가 부족합니다.</p>';
    } else {
        const latestGap = gdpGapData[gdpGapData.length - 1];
        if (latestGap.value > 0.5) {
            result = { status: 'negative', outlook: '🔥 인플레이션 압력', summary: `GDP 갭(${latestGap.value.toFixed(2)}%)이 플러스를 기록, 잠재 성장률을 상회하여 인플레이션 압력이 높습니다.` };
        } else if (latestGap.value < -0.5) {
            result = { status: 'negative', outlook: '📉 경기 침체 우려', summary: `GDP 갭(${latestGap.value.toFixed(2)}%)이 마이너스를 기록, 잠재 성장률을 하회하여 경기 침체 우려가 있습니다.` };
        } else {
            result = { status: 'positive', outlook: '✅ 안정적인 상태', summary: `GDP 갭(${latestGap.value.toFixed(2)}%)이 0에 가까워 경제가 균형 상태에 있습니다.` };
        }
        result.analysis = `<p><strong>최신 데이터 (${latestGap.date.substring(0,7)}):</strong></p><ul><li>현재 GDP 갭: <strong>${latestGap.value.toFixed(2)}%</strong></li></ul><p><strong>분석:</strong> ${result.summary}</p>`;
    }
    
    analysisDiv.innerHTML = `<div class="market-outlook-badge ${result.status}">${result.outlook}</div><div class="analysis-text">${result.analysis}</div>`;
    resultsObject.gdpGap = result;
}
