// js/analysis.js

// ==================================================================
// 데이터 분석 및 가공 함수
// ==================================================================
export function analyzeIndicators(indicators) {
    // 각 지표의 중요도에 따라 '가중치(weight)'를 부여합니다.
    return indicators.map(indicator => {
        if (!indicator) return null;
        const { id, value } = indicator;
        let status = 'neutral', icon = '😐', text = '보통', weight = 2; // 기본 가중치
        switch (id) {
            case 'yield_spread':
                if (value >= 0.1) { status = 'positive'; icon = '✅'; text = '정상 범위'; } 
                else if (value > -0.2) { status = 'neutral'; icon = '⚠️'; text = '역전 우려'; } 
                else { status = 'negative'; icon = '🚨'; text = '침체 신호'; }
                weight = 5; break; // 💡 핵심 선행 지표, 가장 높은 가중치
            case 'us_cpi':
                if (value <= 2.5) { status = 'positive'; icon = '😌'; text = '물가 안정'; } 
                else if (value <= 3.5) { status = 'neutral'; icon = '😐'; text = '인플레 둔화'; } 
                else { status = 'negative'; icon = '🔥'; text = '물가 압력'; }
                weight = 5; break; // 💡 연준 정책의 핵심 변수, 가장 높은 가중치
            case 'nfp':
                if (value >= 250) { status = 'positive'; icon = '👍'; text = '고용 서프라이즈'; } 
                else if (value >= 150) { status = 'neutral'; icon = '😐'; text = '예상 부합'; } 
                else { status = 'negative'; icon = '👎'; text = '고용 쇼크'; }
                weight = 5; break; // 💡 미국 경제의 펀더멘털, 가장 높은 가중치
            case 'vix':
                if (value <= 20) { status = 'positive'; icon = '😌'; text = '시장 안정'; } 
                else if (value <= 30) { status = 'neutral'; icon = '😟'; text = '불안 심리'; } 
                else { status = 'negative'; icon = '😱'; text = '공포 심리'; }
                weight = 4; break; // 💡 시장 심리 반영, 높은 가중치
            case 'export_growth':
                if (value >= 2.0) { status = 'positive'; icon = '📈'; text = '수출 호조'; } 
                else if (value >= 0) { status = 'neutral'; icon = '📊'; text = '소폭 개선'; } 
                else { status = 'negative'; icon = '📉'; text = '수출 부진'; }
                weight = 4; break; // 💡 한국 경제 핵심 동력, 높은 가중치
            case 'gdp_growth':
                 if (value >= 0.7) { status = 'positive'; icon = '👍'; text = '견조한 회복'; } 
                else if (value >= 0.3) { status = 'neutral'; icon = '😐'; text = '완만한 성장'; } 
                else { status = 'negative'; icon = '👎'; text = '성장 둔화'; }
                weight = 5; break; // 💡 경제 성장의 바로미터, 가장 높은 가중치
            case 'exchange_rate':
                if (value <= 1300) { status = 'positive'; icon = '💵'; text = '환율 안정'; }
                else if (value <= 1380) { status = 'neutral'; icon = '〰️'; text = '변동성 확대'; }
                else { status = 'negative'; icon = '💸'; text = '원화 약세'; }
                weight = 4; break;
            case 'kor_bond_3y':
                if (value <= 3.5) { status = 'positive'; icon = '✅'; text = '금리 안정'; }
                else if (value <= 4.0) { status = 'neutral'; icon = '⚠️'; text = '상승 압력'; }
                else { status = 'negative'; icon = '🚨'; text = '고금리 부담'; }
                weight = 3; break;
            case 'm2_growth':
                if (value >= 5 && value <= 7) { status = 'positive'; icon = '💧'; text = '유동성 적정'; }
                else { status = 'neutral'; icon = '〰️'; text = '과잉/부족 우려'; }
                weight = 2; break;
        }
        return { ...indicator, status, icon, text, weight };
    }).filter(Boolean); // null 값을 제거
}

/**
 * 💡 [핵심 업그레이드]
 * 모든 단기/장기 지표를 종합하여 복합적인 시장 시나리오를 분석하고 구체적인 전망을 생성합니다.
 */
export function getMarketOutlook(analyzedIndicators, macroResults) {
    if (!analyzedIndicators || analyzedIndicators.length === 0) {
        return { status: 'neutral', signal: '🤔', title: '분석 데이터 부족', analysis: '시장 종합 전망을 분석하기 위한 데이터가 부족합니다.' };
    }

    // 1. 가중치 기반 종합 점수 계산
    let score = 0;
    let totalWeight = 0;
    analyzedIndicators.forEach(ind => {
        if (ind && ind.weight > 0) {
            totalWeight += ind.weight;
            if (ind.status === 'positive') score += ind.weight;
            else if (ind.status === 'negative') score -= ind.weight;
        }
    });
    const finalScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;

    // 2. 긍정적 / 부정적 요인 동적 분리
    const positiveDrivers = [];
    const negativeDrivers = [];

    // 거시 분석 요약 추가
    if (macroResults.marshallK) {
        if (macroResults.marshallK.status === 'positive') positiveDrivers.push('유동성 정상화(마샬케이)');
        else if (macroResults.marshallK.status === 'negative') negativeDrivers.push('과잉 유동성 우려(마샬케이)');
    }
    if (macroResults.gdpGap) {
        if (macroResults.gdpGap.status === 'positive') positiveDrivers.push('안정적 GDP 갭');
        else if (macroResults.gdpGap.status === 'negative') negativeDrivers.push(macroResults.gdpGap.outlook.includes('인플레') ? '인플레이션 압력(GDP 갭)' : '경기 침체 우려(GDP 갭)');
    }
    if (macroResults.gdpConsumption) {
        if (macroResults.gdpConsumption.status === 'positive') positiveDrivers.push('소비/GDP 동반 성장');
        else if (macroResults.gdpConsumption.status === 'negative') negativeDrivers.push('소비 둔화 우려');
    }

    // 주요 단기 지표 요약 추가 (가중치가 높은 순으로 정렬)
    analyzedIndicators
        .filter(ind => ind && ind.weight >= 4)
        .sort((a, b) => b.weight - a.weight)
        .forEach(ind => {
            if (ind.status === 'positive') {
                positiveDrivers.push(`${ind.name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim()}(${ind.text})`);
            } else if (ind.status === 'negative') {
                negativeDrivers.push(`${ind.name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim()}(${ind.text})`);
            }
        });

    // 3. 최종 전망 동적 생성
    let finalStatus = 'neutral', finalSignal = '📊', finalTitle = '혼조세 국면', finalAnalysis = '';

    if (finalScore > 30) { // 긍정 점수가 높을 때
        finalStatus = 'positive';
        finalSignal = '📈';
        finalTitle = '완만한 회복 기대';
        finalAnalysis = `<b>[종합 분석]</b> 주요 경제 지표들이 긍정적인 신호를 보내고 있어, 점진적인 경기 회복이 기대됩니다.<br><br><b>[핵심 동력]</b> <span class="positive-text">${positiveDrivers.join(', ')}</span> 등이 시장의 상승을 이끌고 있습니다.<br><br>${negativeDrivers.length > 0 ? `<b>[잠재 위험]</b> 다만, <span class="negative-text">${negativeDrivers.join(', ')}</span> 등은 여전히 변동성 요인으로 작용할 수 있어 주의가 필요합니다.` : '특별한 위험 요인은 관찰되지 않고 있습니다.'}`;
    } else if (finalScore < -30) { // 부정 점수가 높을 때
        finalStatus = 'negative';
        finalSignal = '📉';
        finalTitle = '경기 둔화 우려';
        finalAnalysis = `<b>[종합 분석]</b> 여러 지표에서 경고 신호가 감지되어, 경기 둔화에 대한 경계심을 높여야 할 시점입니다.<br><br><b>[핵심 위험]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span> 등이 시장에 상당한 부담으로 작용하고 있습니다.<br><br>${positiveDrivers.length > 0 ? `<b>[긍정적 측면]</b> 그럼에도 불구하고 <span class="positive-text">${positiveDrivers.join(', ')}</span> 등은 추가적인 하락을 방어하는 요인이 될 수 있습니다.` : '반등을 이끌만한 뚜렷한 동력이 보이지 않습니다.'}`;
    } else { // 긍정/부정 요인이 팽팽할 때 (혼조세)
        finalStatus = 'neutral';
        finalSignal = '📊';
        finalTitle = '방향성 탐색 구간';
        finalAnalysis = `<b>[종합 분석]</b> 현재 시장은 긍정적 요인과 부정적 요인이 팽팽하게 맞서며 뚜렷한 방향성을 보이지 않고 있습니다. 작은 충격에도 변동성이 커질 수 있는 구간입니다.<br><br><b>[긍정적 요인]</b> <span class="positive-text">${positiveDrivers.join(', ')}</span>.<br><b>[부정적 요인]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span>.<br><br><b>[전략 제안]</b> 향후 발표될 주요 지표(특히 CPI, NFP)의 결과에 따라 시장의 균형이 한쪽으로 기울 가능성이 높습니다. 그때까지는 보수적인 관점에서 위험 관리에 집중하는 전략이 유효해 보입니다.`;
    }

    return { status: finalStatus, signal: finalSignal, title: finalTitle, analysis: finalAnalysis };
}

// ==================================================================
// 자산군별 투자 의견 및 섹터 전망 (더 정교하게 수정)
// ==================================================================
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
        if (title.includes('스태그플레이션') || title.includes('인플레이션')) {
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

export function analyzeMarshallKTrend(chartData, resultsObject) {
    const analysisDiv = document.getElementById('marshall-analysis');
    let result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '', analysis: '' };

    if (!chartData || chartData.length < 8) {
        result.analysis = '<p class="loading-text">분석할 데이터가 부족합니다.</p>';
    } else {
        const latest = chartData[chartData.length - 1];
        const avgMarshallK = chartData.reduce((sum, d) => sum + d.marshallK, 0) / chartData.length;
        
        if (latest.marshallK > avgMarshallK * 1.1) { // 평균보다 10% 이상 높을 때
            result = { status: 'negative', outlook: '🚨 과잉 유동성 우려', summary: '시중에 과도한 유동성이 공급되어 자산 버블 및 경기 둔화의 위험이 있습니다.' };
        } else if (latest.marshallK < chartData[chartData.length - 5].marshallK && latest.interestRate < chartData[chartData.length - 5].interestRate) {
             result = { status: 'positive', outlook: '✅ 경기 회복 초기 신호', summary: '유동성이 정상화되고 금리가 하락하는 추세로, 경기 회복의 초기 신호일 수 있습니다.' };
        } else {
             result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '유동성과 금리가 명확한 방향성 없이 과도기적 국면에 있습니다.' };
        }
        result.analysis = `<p><strong>현재 상황:</strong> 마샬케이 ${latest.marshallK.toFixed(2)}, 10년물 금리 ${latest.interestRate.toFixed(2)}%</p><p>${result.summary}</p>`;
    }
    
    if(analysisDiv) analysisDiv.innerHTML = `<div class="market-outlook-badge ${result.status}">${result.outlook}</div><div class="analysis-text">${result.analysis}</div>`;
    resultsObject.marshallK = result;
}

export function analyzeGdpConsumption(gdpObs, pceObs, resultsObject) {
    const analysisDiv = document.getElementById('gdp-consumption-analysis');
    let result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '', analysis: '' };

    try {
        // 데이터가 최소 2년치(8분기)는 있어야 추세 비교 가능
        if (!gdpObs || gdpObs.length < 9 || !pceObs || pceObs.length < 9) throw new Error("데이터 부족");
        
        // 1. 최신 분기 성장률 (YoY)
        const gdpGrowth = ((parseFloat(gdpObs[0].value) / parseFloat(gdpObs[4].value)) - 1) * 100;
        const pceGrowth = ((parseFloat(pceObs[0].value) / parseFloat(pceObs[4].value)) - 1) * 100;

        // 2. 직전 분기 성장률 (YoY) - '추세' 계산용
        const prevGdpGrowth = ((parseFloat(gdpObs[1].value) / parseFloat(gdpObs[5].value)) - 1) * 100;
        
        // 3. 추세 판단 (최신 성장률 > 직전 성장률)
        const gdpTrendPositive = gdpGrowth > prevGdpGrowth;
        const trendText = gdpTrendPositive ? "(추세 개선)" : "(추세 둔화)";

        // 4. 새로운 4분면 로직 적용
        if (gdpGrowth > 1.5) {
            if (gdpTrendPositive) {
                result = { status: 'positive', outlook: '✅ 확장 국면', summary: `GDP와 소비가 모두 견조하며 성장률이 가속화${trendText}되고 있습니다.` };
            } else {
                // 이 부분이 사용자님이 지적한 현재 상황입니다.
                result = { status: 'neutral', outlook: '⚠️ 둔화 국면', summary: `GDP 성장률은 양호한 수준이나, 직전 분기 대비 성장 모멘텀이 약화${trendText}되고 있습니다.` };
            }
        } else if (gdpGrowth > 0) {
             if (gdpTrendPositive) {
                result = { status: 'positive', outlook: '📈 회복 국면', summary: `경기가 바닥을 다지고 성장 모멘텀이 개선${trendText}되고 있습니다.` };
            } else {
                result = { status: 'negative', outlook: '📉 침체 우려', summary: `성장률이 0%에 근접하고 모멘텀도 약화${trendText}되어 경기 침체 우려가 있습니다.` };
            }
        } else {
            // gdpGrowth가 0 미만일 때
            result = { status: 'negative', outlook: '🚨 경기 침체 국면', summary: `GDP가 마이너스 성장을 기록했습니다 ${trendText}.` };
        }

        result.analysis = `<p><strong>최신 데이터 (${gdpObs[0].date.substring(0,7)}):</strong></p>
            <ul>
                <li>실질 GDP (YoY): <strong>${gdpGrowth.toFixed(2)}%</strong> ${trendText}</li>
                <li>실질 PCE (YoY): <strong>${pceGrowth.toFixed(2)}%</strong></li>
                <li>(참고) 직전분기 GDP (YoY): ${prevGdpGrowth.toFixed(2)}%</li>
            </ul>
            <p><strong>분석:</strong> ${result.summary}</p>`;

    } catch (error) {
        result.analysis = `<p style="color:#dc3545;">GDP/소비 데이터 분석에 실패했습니다. (데이터 부족 또는 오류)</p>`;
    }

    if(analysisDiv) analysisDiv.innerHTML = `<div class="market-outlook-badge ${result.status}">${result.outlook}</div><div class="analysis-text">${result.analysis}</div>`;
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
    
    if(analysisDiv) analysisDiv.innerHTML = `<div class="market-outlook-badge ${result.status}">${result.outlook}</div><div class="analysis-text">${result.analysis}</div>`;
    resultsObject.gdpGap = result;
}
