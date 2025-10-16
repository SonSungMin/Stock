// js/analysis.js
// 이 파일은 외부 모듈(api.js)을 불러오지 않으므로 import 구문이 필요 없습니다.

// ==================================================================
// 데이터 분석 및 가공 함수
// ==================================================================
export function analyzeIndicators(indicators) {
    return indicators.map(indicator => {
        const { id, value } = indicator;
        let status = 'neutral', icon = '😐', text = '보통', weight = 2;

        switch (id) {
            case 'yield_spread':
                if (value >= 0) { status = 'positive'; icon = '✅'; text = '정상 범위'; } 
                else if (value > -0.1) { status = 'neutral'; icon = '⚠️'; text = '역전폭 축소'; } 
                else { status = 'negative'; icon = '🚨'; text = '침체 우려'; }
                weight = 5;
                break;
            case 'exchange_rate':
                if (value <= 1300) { status = 'positive'; icon = '💵'; text = '환율 안정'; }
                else if (value <= 1350) { status = 'neutral'; icon = '〰️'; text = '변동성 확대'; }
                else { status = 'negative'; icon = '💸'; text = '원화 약세'; }
                weight = 4;
                break;
            case 'vix':
                if (value <= 20) { status = 'positive'; icon = '😌'; text = '시장 안정'; }
                else if (value <= 30) { status = 'neutral'; icon = '😟'; text = '불안 심리'; }
                else { status = 'negative'; icon = '😱'; text = '공포 심리'; }
                weight = 4;
                break;
            case 'dollar_index':
                if (value <= 100) { status = 'positive'; icon = '💲'; text = '달러 약세'; }
                else { status = 'negative'; icon = '💰'; text = '달러 강세'; }
                weight = 3;
                break;
            case 'wti_price':
                if (value <= 80) { status = 'positive'; icon = '⛽'; text = '유가 안정'; }
                else if (value <= 100) { status = 'neutral'; icon = '🔺'; text = '상승 압력'; }
                else { status = 'negative'; icon = '🔥'; text = '고유가 부담'; }
                weight = 3;
                break;
            case 'gdp_growth':
                if (value >= 0.7) { status = 'positive'; icon = '👍'; text = '견조한 회복세'; }
                else if (value >= 0.3) { status = 'neutral'; icon = '😐'; text = '완만한 성장'; }
                else { status = 'negative'; icon = '👎'; text = '성장 둔화 우려'; }
                weight = 5;
                break;
            case 'export_growth':
                if (value >= 2.0) { status = 'positive'; icon = '📈'; text = '플러스 전환'; }
                else if (value >= 0) { status = 'neutral'; icon = '📊'; text = '소폭 개선'; }
                else { status = 'negative'; icon = '📉'; text = '수출 부진'; }
                weight = 5;
                break;
            case 'cpi':
            case 'us_cpi':
                if (value <= 3.0) { status = 'positive'; icon = '😌'; text = '물가 안정세'; }
                else if (value <= 4.0) { status = 'neutral'; icon = '😐'; text = '인플레 둔화'; }
                else { status = 'negative'; icon = '🔥'; text = '물가 압력 지속'; }
                weight = 4;
                break;
            case 'consumer_sentiment':
                if (value >= 100) { status = 'positive'; icon = '😊'; text = '소비 심리 낙관'; }
                else if (value >= 90) { status = 'neutral'; icon = '😐'; text = '소비 심리 중립'; }
                else { status = 'negative'; icon = '😟'; text = '소비 심리 비관'; }
                weight = 3;
                break;
            case 'corp_bond_spread':
                if (value <= 0.8) { status = 'positive'; icon = '✅'; text = '신용 위험 완화'; }
                else if (value <= 1.2) { status = 'neutral'; icon = '⚠️'; text = '신용 위험 보통'; }
                else { status = 'negative'; icon = '🚨'; text = '신용 위험 증가'; }
                weight = 4;
                break;
            case 'nfp':
                if (value >= 250) { status = 'positive'; icon = '👍'; text = '고용 서프라이즈'; }
                else if (value >= 150) { status = 'neutral'; icon = '😐'; text = '예상 부합'; }
                else { status = 'negative'; icon = '👎'; text = '고용 쇼크'; }
                weight = 5;
                break;
            case 'philly_fed':
                if (value >= 10) { status = 'positive'; icon = '📈'; text = '확장 국면'; }
                else if (value >= -5) { status = 'neutral'; icon = '😐'; text = '보합세'; }
                else { status = 'negative'; icon = '📉'; text = '위축 국면'; }
                weight = 3;
                break;
             case 'unemployment':
                if (value <= 3.0) { status = 'positive'; icon = '💪'; text = '완전고용 수준'; }
                else { status = 'negative'; icon = '😥'; text = '고용 시장 악화'; }
                weight = 3;
                break;
            case 'base_rate':
                if (value <= 2.5) { status = 'positive'; icon = '💰'; text = '완화적'; }
                else if (value <= 3.5) { status = 'neutral'; icon = '⚖️'; text = '중립적'; }
                else { status = 'negative'; icon = '🔒'; text = '긴축적'; }
                weight = 4;
                break;
             case 'industrial_production':
                if (value >= 1.0) { status = 'positive'; icon = '🏭'; text = '생산 활발'; }
                else if (value >= 0) { status = 'neutral'; icon = '😐'; text = '생산 보합'; }
                else { status = 'negative'; icon = '📉'; text = '생산 위축'; }
                weight = 3;
                break;
            case 'producer_price_index':
                if (value <= 3.0) { status = 'positive'; icon = '😌'; text = '생산자 물가 안정'; }
                else { status = 'negative'; icon = '🔺'; text = '생산자 물가 부담'; }
                weight = 2;
                break;
            default:
                text = '시장 지수'; weight = 0;
                break;
        }
        return { ...indicator, status, icon, text, weight };
    });
}

export function getMarketOutlook(analyzedIndicators, macroResults) {
    if (!analyzedIndicators) analyzedIndicators = [];
    const weightedIndicators = analyzedIndicators.filter(ind => ind.weight > 0);
    
    const totalWeight = weightedIndicators.reduce((sum, ind) => sum + ind.weight, 0);
    let score = 0;
    weightedIndicators.forEach(ind => {
        if (ind.status === 'positive') score += ind.weight;
        else if (ind.status === 'negative') score -= ind.weight;
    });
    
    let outlookScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;
    
    const macroSignals = Object.values(macroResults).filter(Boolean);
    macroSignals.forEach(signal => {
        if (signal.status === 'positive') outlookScore += 15;
        else if (signal.status === 'negative') outlookScore -= 15;
    });

    const positiveSignals = weightedIndicators.filter(i => i.status === 'positive').sort((a,b) => b.weight - a.weight).slice(0, 2);
    const negativeSignals = weightedIndicators.filter(i => i.status === 'negative').sort((a,b) => b.weight - a.weight).slice(0, 2);
    const formatSignalText = (signals) => signals.map(s => s.name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim()).join(', ');

    let analysisText = '';
    const macroSummary = macroSignals.map(s => s.summary).filter(Boolean).join(' ');
    if(macroSummary) {
        analysisText += `<b>[거시 분석]</b> ${macroSummary}<br><br>`;
    }

    if (outlookScore > 35) {
        analysisText += `<b>[단기 분석]</b> ${formatSignalText(positiveSignals)} 등 주요 지표들이 견조한 모습을 보여 경기 회복과 증시 상승 기대감을 높입니다.`;
        return { status: 'positive', signal: '📈', title: '긍정적 전망', analysis: analysisText };
    } else if (outlookScore < -35) {
        analysisText += `<b>[단기 분석]</b> ${formatSignalText(negativeSignals)} 등 여러 지표에서 경고 신호가 나타나 경기 둔화 우려를 높이고 있습니다.`;
        return { status: 'negative', signal: '📉', title: '부정적 전망', analysis: analysisText };
    } else {
        analysisText += `<b>[단기 분석]</b> 긍정적 신호(${formatSignalText(positiveSignals)})와 부정적 신호(${formatSignalText(negativeSignals)})가 혼재되어 있어, 당분간 시장은 변동성을 보일 수 있습니다.`;
        return { status: 'neutral', signal: '📊', title: '혼조세 전망', analysis: analysisText };
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
