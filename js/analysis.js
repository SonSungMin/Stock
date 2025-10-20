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

// sonsungmin/stock/Stock-cceea318df4dbf2c4ea84f7679eb77e001061ade/js/analysis.js

/**
 * 💡 [핵심 업그레이드]
 * 모든 단기/장기 지표를 종합하여 복합적인 시장 시나리오를 분석하고 구체적인 전망을 생성합니다.
 *
 * [수정된 내용]
 * 1. macroResults가 null이나 undefined로 전달될 경우를 대비하여, 빈 객체(safeMacroResults)로 초기화하는 방어 코드를 추가했습니다.
 * 2. macroCount가 0일 때 (즉, 분석된 거시 지표가 없을 때) 종합 점수(finalScore)가 0.4만 곱해지는 오류를 수정했습니다.
 * 이제 거시 지표가 없으면 단기 지표 점수(normalizedShortTerm)를 그대로 종합 점수로 사용합니다.
 * 3. [최신] 최종 점수를 분석 텍스트에서 분리하고, 반환 객체에 'score' 키로 추가합니다.
 */
export function getMarketOutlook(analyzedIndicators, macroResults) {
    // 💡 [수정] macroResults가 null일 경우를 대비해 빈 객체로 안전하게 처리합니다.
    const safeMacroResults = macroResults || {};

    if (!analyzedIndicators || analyzedIndicators.length === 0) {
        // 💡 [수정] score: 0을 반환하도록 추가
        return { status: 'neutral', signal: '🤔', title: '분석 데이터 부족', analysis: '시장 종합 전망을 분석하기 위한 데이터가 부족합니다.', score: 0 };
    }

    // 1. 가중치 기반 단기 지표 점수 계산
    let shortTermScore = 0;
    let totalWeight = 0;
    analyzedIndicators.forEach(ind => {
        if (ind && ind.weight > 0) {
            totalWeight += ind.weight;
            if (ind.status === 'positive') shortTermScore += ind.weight;
            else if (ind.status === 'negative') shortTermScore -= ind.weight;
        }
    });
    const normalizedShortTerm = totalWeight > 0 ? (shortTermScore / totalWeight) * 100 : 0;

    // 2. 거시 분석 점수 계산 (동일 가중치)
    let macroScore = 0;
    let macroCount = 0;
    
    // 💡 [수정] safeMacroResults를 사용하여 안전하게 접근합니다.
    if (safeMacroResults.marshallK) {
        macroCount++;
        if (safeMacroResults.marshallK.status === 'positive') macroScore += 1;
        else if (safeMacroResults.marshallK.status === 'negative') macroScore -= 1;
    }
    if (safeMacroResults.gdpGap) {
        macroCount++;
        if (safeMacroResults.gdpGap.status === 'positive') macroScore += 1;
        else if (safeMacroResults.gdpGap.status === 'negative') macroScore -= 1;
    }
    if (safeMacroResults.gdpConsumption) {
        macroCount++;
        if (safeMacroResults.gdpConsumption.status === 'positive') macroScore += 1;
        else if (safeMacroResults.gdpConsumption.status === 'negative') macroScore -= 1;
    }
    
    const normalizedMacro = macroCount > 0 ? (macroScore / macroCount) * 100 : 0;

    // 3. 종합 점수: 단기 40% + 거시 60% (거시가 더 중요)
    // 💡 [수정] 거시 지표가 없으면(macroCount === 0) 단기 점수를 100% 반영, 있으면 가중 평균
    const finalScore = (macroCount > 0)
        ? (normalizedShortTerm * 0.4) + (normalizedMacro * 0.6)
        : normalizedShortTerm;

    // 4. 긍정적 / 부정적 요인 동적 분리
    const positiveDrivers = [];
    const negativeDrivers = [];
    const neutralFactors = [];

    // 거시 분석 요약 추가 (우선 순위 높음)
    // 💡 [수정] safeMacroResults를 사용하여 안전하게 접근합니다.
    if (safeMacroResults.gdpConsumption) {
        const indicator = safeMacroResults.gdpConsumption;
        if (indicator.status === 'positive') positiveDrivers.push(`경기 사이클(${indicator.outlook})`);
        else if (indicator.status === 'negative') negativeDrivers.push(`경기 사이클(${indicator.outlook})`);
        else neutralFactors.push(`경기 사이클(${indicator.outlook})`);
    }
    
    if (safeMacroResults.gdpGap) {
        const indicator = safeMacroResults.gdpGap;
        if (indicator.status === 'positive') positiveDrivers.push(`GDP 갭(${indicator.outlook})`);
        else if (indicator.status === 'negative') negativeDrivers.push(`GDP 갭(${indicator.outlook})`);
        else neutralFactors.push(`GDP 갭(${indicator.outlook})`);
    }
    
    if (safeMacroResults.marshallK) {
        const indicator = safeMacroResults.marshallK;
        if (indicator.status === 'positive') positiveDrivers.push(`유동성 환경(${indicator.outlook})`);
        else if (indicator.status === 'negative') negativeDrivers.push(`유동성 환경(${indicator.outlook})`);
        else neutralFactors.push(`유동성 환경(${indicator.outlook})`);
    }

    // 주요 단기 지표 요약 추가 (가중치 4 이상만)
    analyzedIndicators
        .filter(ind => ind && ind.weight >= 4)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 4) // 상위 4개만
        .forEach(ind => {
            const cleanName = ind.name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim();
            if (ind.status === 'positive') {
                positiveDrivers.push(`${cleanName}(${ind.text})`);
            } else if (ind.status === 'negative') {
                negativeDrivers.push(`${cleanName}(${ind.text})`);
            }
        });

    // 5. 최종 전망 동적 생성 (더 세밀한 구간 분할)
    let finalStatus, finalSignal, finalTitle, finalAnalysis;

    if (finalScore > 50) {
        // 강한 긍정
        finalStatus = 'positive';
        finalSignal = '🚀';
        finalTitle = '강한 상승 모멘텀';
        finalAnalysis = `<b>[종합 분석]</b> 거시 경제 펀더멘털과 단기 지표 모두 강한 긍정 신호를 보내고 있어, 지속적인 상승 랠리가 기대됩니다.<br><br><b>[핵심 동력]</b> <span class="positive-text">${positiveDrivers.join(', ')}</span> 등이 시장 상승을 강력히 뒷받침하고 있습니다.${negativeDrivers.length > 0 ? `<br><br><b>[잠재 리스크]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span> 등은 단기 변동성 요인이 될 수 있으나, 전체 흐름을 바꾸기는 어려워 보입니다.` : ''}`;
    } else if (finalScore > 20) {
        // 온건한 긍정
        finalStatus = 'positive';
        finalSignal = '📈';
        finalTitle = '완만한 회복 기대';
        finalAnalysis = `<b>[종합 분석]</b> 주요 경제 지표들이 점진적인 개선 흐름을 보이고 있어, 완만한 상승세가 이어질 것으로 예상됩니다.<br><br><b>[긍정 요인]</b> <span class="positive-text">${positiveDrivers.join(', ')}</span>.<br><br>${negativeDrivers.length > 0 ? `<b>[주의 요인]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span> 등은 상승 속도를 제한하는 요인으로 작용할 수 있습니다.` : '긍정적인 흐름을 저해하는 뚜렷한 악재는 보이지 않습니다.'}`;
    } else if (finalScore > -20) {
        // 혼조
        finalStatus = 'neutral';
        finalSignal = '📊';
        finalTitle = '방향성 탐색 구간';
        finalAnalysis = `<b>[종합 분석]</b> 거시 지표와 단기 지표에서 상반된 신호가 나오며, 시장은 뚜렷한 방향성 없이 박스권에서 등락을 반복할 가능성이 높습니다.<br><br><b>[긍정 요인]</b> <span class="positive-text">${positiveDrivers.length > 0 ? positiveDrivers.join(', ') : '없음'}</span>.<br><b>[부정 요인]</b> <span class="negative-text">${negativeDrivers.length > 0 ? negativeDrivers.join(', ') : '없음'}</span>.<br><br><b>[전략 제안]</b> 주요 이벤트(CPI, NFP, FOMC 등)의 결과에 따라 균형이 한쪽으로 기울 수 있으니, 섣부른 방향성 베팅보다는 변동성 관리에 집중하는 것이 바람직합니다.`;
    } else if (finalScore > -50) {
        // 온건한 부정
        finalStatus = 'negative';
        finalSignal = '📉';
        finalTitle = '경기 둔화 우려';
        finalAnalysis = `<b>[종합 분석]</b> 여러 지표에서 경고 신호가 감지되어, 경기 둔화와 조정 국면에 대비해야 할 시점입니다.<br><br><b>[핵심 위험]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span> 등이 시장에 하방 압력을 가하고 있습니다.${positiveDrivers.length > 0 ? `<br><br><b>[방어 요인]</b> <span class="positive-text">${positiveDrivers.join(', ')}</span> 등이 추가 하락을 제한하는 완충 역할을 할 수 있습니다.` : '<br><br>반등을 이끌만한 뚜렷한 긍정 요인이 부족한 상황입니다.'}`;
    } else {
        // 강한 부정
        finalStatus = 'negative';
        finalSignal = '🚨';
        finalTitle = '강한 하방 압력';
        finalAnalysis = `<b>[종합 분석]</b> 거시 환경과 단기 심리 모두 비관적이며, 위험 관리가 매우 중요한 시점입니다.<br><br><b>[주요 악재]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span>.<br><br><b>[전략 제안]</b> 보수적인 포트폴리오를 유지하며 현금 비중을 확보하고, 시장의 변곡점을 확인하기 전까지 방어적인 자세가 필요합니다.`;
    }

    // 6. 특수 시나리오: 스태그플레이션 (물가↑ + 성장↓)
    const cpi = analyzedIndicators.find(i => i.id === 'us_cpi' || i.id === 'cpi');
    const gdp = analyzedIndicators.find(i => i.id === 'gdp_growth');

    if (finalStatus === 'negative' && 
        (cpi && cpi.status === 'negative') && 
        (gdp && gdp.status === 'negative')) 
    {
        finalSignal = '⚠️';
        finalTitle = '스태그플레이션 우려';
        finalAnalysis = `<b>[특수 시나리오]</b> <span class="negative-text">높은 물가(${cpi.name} ${cpi.text})</span>와 <span class="negative-text">경제 성장 둔화(${gdp.name} ${gdp.text})</span>가 동시에 감지되어 스태그플레이션 위험이 부각되고 있습니다.<br><br><b>[전략 제안]</b> 이는 자산 배분에 가장 어려운 시나리오로, 전통적인 주식/채권 분산 효과가 약화될 수 있습니다. 현금, 원자재, 달러 등 대체 안전자산의 비중을 고려해야 합니다.`;
    }

    // 💡 [수정] 반환 객체에 'score' 추가
    return { 
        status: finalStatus, 
        signal: finalSignal, 
        title: finalTitle, 
        analysis: finalAnalysis,
        score: finalScore.toFixed(0) // 💡 점수 데이터를 별도로 반환
    };
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

    try {
        // 최소 2년치(8분기) 데이터 필요 (추세 비교를 위해)
        if (!chartData || chartData.length < 8) {
            throw new Error("분석할 데이터가 부족합니다.");
        }
        
        const latest = chartData[chartData.length - 1];
        const prevYear = chartData[chartData.length - 5]; // 1년 전 데이터

        // 1. 1년 전 대비 추세(방향성) 계산
        const mkTrend = latest.marshallK - prevYear.marshallK;
        const rateTrend = latest.interestRate - prevYear.interestRate;

        // 2. 추세에 따른 4분면 분석 (유동성 사이클)
        let trendText_MK = mkTrend > 0 ? "증가" : "감소";
        let trendText_Rate = rateTrend > 0 ? "상승" : "하락";

        if (rateTrend < 0 && mkTrend > 0) {
            // Q1: 금리 하락 + 유동성 증가 (가장 좋음)
            result = { 
                status: 'positive', 
                outlook: '✅ 유동성 장세 (완화)', 
                summary: '금리가 하락하고 시중 유동성이 증가하는 가장 이상적인 "금융 완화" 국면입니다. 자산 시장에 긍정적입니다.' 
            };
        } else if (rateTrend > 0 && mkTrend > 0) {
            // Q2: 금리 상승 + 유동성 증가 (과열)
            result = { 
                status: 'neutral', 
                outlook: '⚠️ 과열/버블 우려', 
                summary: '풍부한 유동성이 인플레이션/과열 우려를 자극해 금리가 상승하는 "과열" 국면입니다. 경기 사이클 후반부 신호입니다.' 
            };
        } else if (rateTrend > 0 && mkTrend < 0) {
            // Q3: 금리 상승 + 유동성 감소 (긴축)
            result = { 
                status: 'negative', 
                outlook: '🚨 금융 긴축 국면', 
                summary: '금리가 상승하고 유동성이 축소되는 "금융 긴축" 국면입니다. 자산 시장에 가장 부정적인 환경입니다.' 
            };
        } else {
            // Q4: 금리 하락 + 유동성 감소 (침체)
            result = { 
                status: 'negative', 
                outlook: '📉 침체 국면 (바닥권)', 
                summary: '경기 둔화로 인해 금리는 하락하지만, 신용 경색 등으로 유동성이 마르는 "침체" 국면입니다. 위험 관리가 필요합니다.' 
            };
        }

        result.analysis = `<p><strong>최신 데이터 (${latest.label}):</strong></p>
            <ul>
                <li>마샬케이: ${latest.marshallK.toFixed(2)} (1년 전 대비 ${mkTrend.toFixed(2)}) - <strong>[${trendText_MK} 추세]</strong></li>
                <li>10년물 금리: ${latest.interestRate.toFixed(2)}% (1년 전 대비 ${rateTrend.toFixed(2)}%p) - <strong>[${trendText_Rate} 추세]</strong></li>
            </ul>
            <p><strong>💡 종합 분석:</strong> ${result.summary}</p>`;

    } catch (error) {
         result.analysis = `<p class="loading-text">${error.message}</p>`;
    }
    
    if(analysisDiv) analysisDiv.innerHTML = `<div class="market-outlook-badge ${result.status}">${result.outlook}</div><div class="analysis-text">${result.analysis}</div>`;
    resultsObject.marshallK = result;
}

export function analyzeGdpConsumption(gdpObs, pceObs, resultsObject) {
    const analysisDiv = document.getElementById('gdp-consumption-analysis');
    let result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '', analysis: '' };

    try {
        // 데이터가 최소 3년치(12분기)는 있어야 추세 비교 가능
        if (!gdpObs || gdpObs.length < 13 || !pceObs || pceObs.length < 13) throw new Error("데이터 부족");
        
        // 1. 최신 분기 성장률 (YoY)
        const gdpGrowth = ((parseFloat(gdpObs[0].value) / parseFloat(gdpObs[4].value)) - 1) * 100;
        const pceGrowth = ((parseFloat(pceObs[0].value) / parseFloat(pceObs[4].value)) - 1) * 100;

        // 2. 최근 4분기 이동평균 성장률 계산 (장기 추세)
        const recentGdpGrowths = [];
        for (let i = 0; i < 4; i++) {
            const growth = ((parseFloat(gdpObs[i].value) / parseFloat(gdpObs[i + 4].value)) - 1) * 100;
            recentGdpGrowths.push(growth);
        }
        const avgRecentGrowth = recentGdpGrowths.reduce((a, b) => a + b, 0) / 4;
        
        // 3. 1년 전 4분기 이동평균 성장률 (과거 추세와 비교)
        const pastGdpGrowths = [];
        for (let i = 4; i < 8; i++) {
            const growth = ((parseFloat(gdpObs[i].value) / parseFloat(gdpObs[i + 4].value)) - 1) * 100;
            pastGdpGrowths.push(growth);
        }
        const avgPastGrowth = pastGdpGrowths.reduce((a, b) => a + b, 0) / 4;

        // 4. 추세 판단: 최근 평균이 과거 평균보다 높으면 상승 추세
        const trendImproving = avgRecentGrowth > avgPastGrowth;
        const trendStrength = Math.abs(avgRecentGrowth - avgPastGrowth);
        
        // 5. 모멘텀 분석: 최근 2분기 vs 그 이전 2분기
        const veryRecentMomentum = (recentGdpGrowths[0] + recentGdpGrowths[1]) / 2;
        const slightlyOlderMomentum = (recentGdpGrowths[2] + recentGdpGrowths[3]) / 2;
        const momentumAccelerating = veryRecentMomentum > slightlyOlderMomentum;

        // 6. 종합 판단 로직
        let trendText, momentumText;
        
        if (trendImproving) {
            trendText = trendStrength > 0.5 ? "강한 상승 추세" : "완만한 상승 추세";
        } else {
            trendText = trendStrength > 0.5 ? "뚜렷한 하락 추세" : "완만한 하락 추세";
        }
        
        momentumText = momentumAccelerating ? "가속" : "둔화";

        // 7. 4분면 분석 (절대 수준 + 추세 방향)
        if (gdpGrowth > 2.0) {
            // 높은 성장률 구간
            if (trendImproving && momentumAccelerating) {
                result = { 
                    status: 'positive', 
                    outlook: '🚀 강한 확장 국면', 
                    summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 견조하며, ${trendText} + 모멘텀 ${momentumText} 중입니다.` 
                };
            } else if (!trendImproving && !momentumAccelerating) {
                result = { 
                    status: 'neutral', 
                    outlook: '⚠️ 고점 경계 국면', 
                    summary: `GDP 성장률은 ${gdpGrowth.toFixed(2)}%로 양호하나, ${trendText} + 모멘텀 ${momentumText}로 전환되어 고점 통과 가능성이 있습니다.` 
                };
            } else {
                result = { 
                    status: 'positive', 
                    outlook: '✅ 확장 국면', 
                    summary: `GDP 성장률 ${gdpGrowth.toFixed(2)}%로 양호한 수준이며, ${trendText}입니다.` 
                };
            }
        } else if (gdpGrowth > 1.0) {
            // 중간 성장률 구간
            if (trendImproving && momentumAccelerating) {
                result = { 
                    status: 'positive', 
                    outlook: '📈 회복 국면', 
                    summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 회복 중이며, ${trendText} + 모멘텀 ${momentumText} 중입니다.` 
                };
            } else if (!trendImproving && !momentumAccelerating) {
                result = { 
                    status: 'negative', 
                    outlook: '📉 둔화 국면', 
                    summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 둔화되고 있으며, ${trendText} + 모멘텀 ${momentumText} 중입니다.` 
                };
            } else {
                result = { 
                    status: 'neutral', 
                    outlook: '😐 혼조 국면', 
                    summary: `GDP 성장률 ${gdpGrowth.toFixed(2)}%이며, ${trendText}로 방향성이 불명확합니다.` 
                };
            }
        } else if (gdpGrowth > 0) {
            // 낮은 성장률 구간
            if (trendImproving) {
                result = { 
                    status: 'neutral', 
                    outlook: '🌱 초기 회복 신호', 
                    summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 낮은 수준이나, ${trendText}로 회복 조짐이 보입니다.` 
                };
            } else {
                result = { 
                    status: 'negative', 
                    outlook: '🚨 침체 우려', 
                    summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 매우 낮으며, ${trendText} + 모멘텀 ${momentumText}로 침체 위험이 높습니다.` 
                };
            }
        } else {
            // 마이너스 성장
            result = { 
                status: 'negative', 
                outlook: '💥 경기 침체', 
                summary: `GDP가 ${gdpGrowth.toFixed(2)}%로 마이너스 성장을 기록했습니다. ${trendText}입니다.` 
            };
        }

        result.analysis = `<p><strong>최신 데이터 (${gdpObs[0].date.substring(0,7)}):</strong></p>
            <ul>
                <li>실질 GDP 성장률 (YoY): <strong>${gdpGrowth.toFixed(2)}%</strong></li>
                <li>실질 PCE 성장률 (YoY): <strong>${pceGrowth.toFixed(2)}%</strong></li>
                <li>최근 4분기 평균: <strong>${avgRecentGrowth.toFixed(2)}%</strong> (1년 전 평균: ${avgPastGrowth.toFixed(2)}%)</li>
                <li>추세 분석: <strong>${trendText}</strong> (${trendImproving ? '+' : ''}${(avgRecentGrowth - avgPastGrowth).toFixed(2)}%p)</li>
                <li>단기 모멘텀: <strong>${momentumText}</strong> (최근 2분기 평균: ${veryRecentMomentum.toFixed(2)}% vs 이전: ${slightlyOlderMomentum.toFixed(2)}%)</li>
            </ul>
            <p><strong>💡 종합 분석:</strong> ${result.summary}</p>`;

    } catch (error) {
        result.analysis = `<p style="color:#dc3545;">GDP/소비 데이터 분석에 실패했습니다. (${error.message})</p>`;
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
