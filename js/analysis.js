// js/analysis.js

// ==================================================================
// 데이터 분석 및 가공 함수
// ==================================================================

/**
 * 💡 [수정됨]
 * 신규 지표(ISM PMI, 소비자심리지수, 구리 가격) 분석 로직 추가
 */
export function analyzeIndicators(indicators) {
    // 각 지표의 중요도에 따라 '가중치(weight)'를 부여합니다.
    return indicators.map(indicator => {
        if (!indicator) return null;
        const { id, value } = indicator;
        let status = 'neutral', icon = '😐', text = '보통', weight = 2; // 기본 가중치
        switch (id) {
            // --- 기존 지표 분석 ---
            case 'yield_spread':
                if (value >= 0.1) { status = 'positive'; icon = '✅'; text = '정상 범위'; }
                else if (value > -0.2) { status = 'neutral'; icon = '⚠️'; text = '역전 우려'; }
                else { status = 'negative'; icon = '🚨'; text = '침체 신호'; }
                weight = 5; break;
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
            case 'vix':
                if (value <= 20) { status = 'positive'; icon = '😌'; text = '시장 안정'; }
                else if (value <= 30) { status = 'neutral'; icon = '😟'; text = '불안 심리'; }
                else { status = 'negative'; icon = '😱'; text = '공포 심리'; }
                weight = 4; break;
            case 'export_growth':
                if (value >= 2.0) { status = 'positive'; icon = '📈'; text = '수출 호조'; }
                else if (value >= 0) { status = 'neutral'; icon = '📊'; text = '소폭 개선'; }
                else { status = 'negative'; icon = '📉'; text = '수출 부진'; }
                weight = 4; break;
            case 'gdp_growth':
                 if (value >= 0.7) { status = 'positive'; icon = '👍'; text = '견조한 회복'; }
                else if (value >= 0.3) { status = 'neutral'; icon = '😐'; text = '완만한 성장'; }
                else { status = 'negative'; icon = '👎'; text = '성장 둔화'; }
                weight = 5; break;
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
            case 'sox_index':
                // (임시 로직: 예시로 4000 이상이면 긍정으로 판단)
                if (value >= 4000) { status = 'positive'; icon = '📈'; text = '상승 추세'; }
                else { status = 'negative'; icon = '📉'; text = '하락/조정'; }
                weight = 3; 
                break;
                
            // --- 💡 [신규 추가] S&P 500 예측 관련 지표 분석 ---
            case 'ism_pmi':
                if (value >= 55) { status = 'positive'; icon = '🚀'; text = '강한 확장'; weight = 4; } // S&P 500에 중요
                else if (value >= 50) { status = 'positive'; icon = '📈'; text = '확장 국면'; weight = 3; }
                else if (value >= 45) { status = 'negative'; icon = '⚠️'; text = '둔화/위축 우려'; weight = 4; } // 하락 신호 중요
                else { status = 'negative'; icon = '🚨'; text = '경기 위축'; weight = 5; } // 매우 중요
                break;
            case 'consumer_sentiment': // 미국 미시간대 CSI
                if (value >= 80) { status = 'positive'; icon = '😊'; text = '소비 심리 낙관'; weight = 3; }
                else if (value >= 70) { status = 'neutral'; icon = '😐'; text = '소비 심리 중립'; weight = 2; }
                else { status = 'negative'; icon = '😟'; text = '소비 심리 비관'; weight = 3; }
                break;
             case 'copper_price': // 구리 가격 (YoY)
                 // YoY 기준, 0% 이상이면 긍정으로 단순 판단 (추후 개선 필요)
                 // 만약 YoY 계산 실패로 레벨 값($/mt)이 들어온 경우, 분석 불가(neutral)
                 if (indicator.unit === '%') {
                     if (value > 5) { status = 'positive'; icon = '📈'; text = '강한 상승'; weight = 3; } // 경기 회복 기대 강함
                     else if (value >= 0) { status = 'positive'; icon = '📈'; text = '상승 추세'; weight = 2; }
                     else if (value > -5) { status = 'neutral'; icon = '횡보'; text = '보합/소폭 하락'; weight = 2; }
                     else { status = 'negative'; icon = '📉'; text = '하락 추세'; weight = 3; } // 경기 둔화 우려
                 } else {
                     status = 'neutral'; icon = '❓'; text = '추세 분석 불가'; weight = 0; // YoY 계산 실패 시
                 }
                break;
            // 다른 한국 지표들 분석 로직 (기존과 동일) ...
            case 'kor_consumer_sentiment': // 한국 CSI
                if (value >= 100) { status = 'positive'; icon = '😊'; text = '소비 심리 낙관'; }
                else if (value >= 90) { status = 'neutral'; icon = '😐'; text = '소비 심리 중립'; }
                else { status = 'negative'; icon = '😟'; text = '소비 심리 비관'; }
                weight = 2;
                break;
            // ... (나머지 한국 지표들)
        }
        return { ...indicator, status, icon, text, weight };
    }).filter(Boolean); // null 값을 제거
}

/**
 * 모든 단기/장기 지표를 종합하여 복합적인 시장 시나리오를 분석하고 구체적인 전망을 생성합니다.
 */
export function getMarketOutlook(analyzedIndicators, macroResults) {
    const safeMacroResults = macroResults || {};

    if (!analyzedIndicators || analyzedIndicators.length === 0) {
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
    if (safeMacroResults.cycle) {
        macroCount++;
        if (safeMacroResults.cycle.status === 'positive') macroScore += 1;
        else if (safeMacroResults.cycle.status === 'negative') macroScore -= 1;
    }
    
    const normalizedMacro = macroCount > 0 ? (macroScore / macroCount) * 100 : 0;

    // 3. 종합 점수: 단기 40% + 거시 60%
    const finalScore = (macroCount > 0)
        ? (normalizedShortTerm * 0.4) + (normalizedMacro * 0.6)
        : normalizedShortTerm;

    // 4. 긍정적 / 부정적 요인 동적 분리
    const positiveDrivers = [];
    const negativeDrivers = [];
    const neutralFactors = [];

    // 거시 분석 요약 추가
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
    if (safeMacroResults.cycle) {
        const indicator = safeMacroResults.cycle;
        const name = '🇰🇷韓 경기순환';
        if (indicator.status === 'positive') positiveDrivers.push(`${name}(${indicator.outlook})`);
        else if (indicator.status === 'negative') negativeDrivers.push(`${name}(${indicator.outlook})`);
        else neutralFactors.push(`${name}(${indicator.outlook})`);
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

    // 5. 최종 전망 동적 생성
    let finalStatus, finalSignal, finalTitle, finalAnalysis;

    if (finalScore > 50) {
        finalStatus = 'positive';
        finalSignal = '🚀';
        finalTitle = '강한 상승 모멘텀';
        finalAnalysis = `<b>[종합 분석]</b> 거시 경제 펀더멘털과 단기 지표 모두 강한 긍정 신호를 보내고 있어, 지속적인 상승 랠리가 기대됩니다.<br><br><b>[핵심 동력]</b> <span class="positive-text">${positiveDrivers.join(', ')}</span> 등이 시장 상승을 강력히 뒷받침하고 있습니다.${negativeDrivers.length > 0 ? `<br><br><b>[잠재 리스크]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span> 등은 단기 변동성 요인이 될 수 있으나, 전체 흐름을 바꾸기는 어려워 보입니다.` : ''}`;
    } else if (finalScore > 20) {
        finalStatus = 'positive';
        finalSignal = '📈';
        finalTitle = '완만한 회복 기대';
        finalAnalysis = `<b>[종합 분석]</b> 주요 경제 지표들이 점진적인 개선 흐름을 보이고 있어, 완만한 상승세가 이어질 것으로 예상됩니다.<br><br><b>[긍정 요인]</b> <span class="positive-text">${positiveDrivers.join(', ')}</span>.<br><br>${negativeDrivers.length > 0 ? `<b>[주의 요인]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span> 등은 상승 속도를 제한하는 요인으로 작용할 수 있습니다.` : '긍정적인 흐름을 저해하는 뚜렷한 악재는 보이지 않습니다.'}`;
    } else if (finalScore > -20) {
        finalStatus = 'neutral';
        finalSignal = '📊';
        finalTitle = '방향성 탐색 구간';
        finalAnalysis = `<b>[종합 분석]</b> 거시 지표와 단기 지표에서 상반된 신호가 나오며, 시장은 뚜렷한 방향성 없이 박스권에서 등락을 반복할 가능성이 높습니다.<br><br><b>[긍정 요인]</b> <span class="positive-text">${positiveDrivers.length > 0 ? positiveDrivers.join(', ') : '없음'}</span>.<br><b>[부정 요인]</b> <span class="negative-text">${negativeDrivers.length > 0 ? negativeDrivers.join(', ') : '없음'}</span>.<br><br><b>[전략 제안]</b> 주요 이벤트(CPI, NFP, FOMC 등)의 결과에 따라 균형이 한쪽으로 기울 수 있으니, 섣부른 방향성 베팅보다는 변동성 관리에 집중하는 것이 바람직합니다.`;
    } else if (finalScore > -50) {
        finalStatus = 'negative';
        finalSignal = '📉';
        finalTitle = '경기 둔화 우려';
        finalAnalysis = `<b>[종합 분석]</b> 여러 지표에서 경고 신호가 감지되어, 경기 둔화와 조정 국면에 대비해야 할 시점입니다.<br><br><b>[핵심 위험]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span> 등이 시장에 하방 압력을 가하고 있습니다.${positiveDrivers.length > 0 ? `<br><br><b>[방어 요인]</b> <span class="positive-text">${positiveDrivers.join(', ')}</span> 등이 추가 하락을 제한하는 완충 역할을 할 수 있습니다.` : '<br><br>반등을 이끌만한 뚜렷한 긍정 요인이 부족한 상황입니다.'}`;
    } else {
        finalStatus = 'negative';
        finalSignal = '🚨';
        finalTitle = '강한 하방 압력';
        finalAnalysis = `<b>[종합 분석]</b> 거시 환경과 단기 심리 모두 비관적이며, 위험 관리가 매우 중요한 시점입니다.<br><br><b>[주요 악재]</b> <span class="negative-text">${negativeDrivers.join(', ')}</span>.<br><br><b>[전략 제안]</b> 보수적인 포트폴리오를 유지하며 현금 비중을 확보하고, 시장의 변곡점을 확인하기 전까지 방어적인 자세가 필요합니다.`;
    }

    // 6. 특수 시나리오: 스태그플레이션
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

    return { 
        status: finalStatus, 
        signal: finalSignal, 
        title: finalTitle, 
        analysis: finalAnalysis,
        score: finalScore.toFixed(0) 
    };
}

import { indicatorDetails } from './indicators.js';
// ==================================================================
// 💡 [신규 추가] S&P 500 예측 함수
// ==================================================================
/**
 * 주요 선행 지표들을 바탕으로 S&P 500의 단기 전망을 예측합니다.
 * @param {object[]} analyzedIndicators - analyzeIndicators 함수로 분석된 지표 배열
 * @returns {object} - { status: 'positive'|'neutral'|'negative', signal: '...', title: '...', analysis: '...' }
 */
export function getSP500Outlook(analyzedIndicators) {
    console.log("getSP500Outlook received indicators:", analyzedIndicators);
    
    // 예측에 사용할 주요 지표 추출
    const pmi = analyzedIndicators.find(i => i.id === 'ism_pmi');
    const csi = analyzedIndicators.find(i => i.id === 'consumer_sentiment'); // 미국 CSI
    const copper = analyzedIndicators.find(i => i.id === 'copper_price');
    const spread = analyzedIndicators.find(i => i.id === 'yield_spread');

    // 필수 지표 중 하나라도 없으면 예측 불가
    if (!pmi || !csi || !spread) {
        return { status: 'neutral', signal: '❓', title: '예측 데이터 부족', analysis: 'S&P 500 전망을 예측하기 위한 핵심 지표(ISM PMI, 소비심리, 장단기금리차) 데이터가 부족합니다.' };
    }

    let score = 0;
    const factors = [];

    // 1. ISM PMI (가중치 높음)
    if (pmi.status === 'positive') {
        score += (pmi.value >= 55) ? 2 : 1; // 강한 확장이면 +2
        factors.push(`<span class="positive-text">ISM PMI ${pmi.text}</span>`);
    } else {
        score -= (pmi.value < 45) ? 2 : 1; // 경기 위축이면 -2
        factors.push(`<span class="negative-text">ISM PMI ${pmi.text}</span>`);
    }

    // 2. 소비자 심리지수
    if (csi.status === 'positive') {
        score += 1;
        factors.push(`<span class="positive-text">소비심리 ${csi.text}</span>`);
    } else if (csi.status === 'negative') {
        score -= 1;
        factors.push(`<span class="negative-text">소비심리 ${csi.text}</span>`);
    } else {
         factors.push(`소비심리 ${csi.text}`);
    }

    // 3. 장단기 금리차 (가중치 높음)
    if (spread.status === 'positive') {
        score += 1;
        factors.push(`<span class="positive-text">장단기 금리차 ${spread.text}</span>`);
    } else if (spread.status === 'negative') {
        score -= 2; // 침체 신호는 매우 중요
        factors.push(`<span class="negative-text">장단기 금리차 ${spread.text}</span>`);
    } else { // 'neutral' (주의 구간)
        score -= 1;
        factors.push(`<span class="negative-text">장단기 금리차 ${spread.text}</span>`);
    }

    // 4. 구리 가격 (참고 지표)
    if (copper) { // 구리 데이터가 있을 경우만
        if (copper.status === 'positive') {
            score += (copper.value > 5) ? 1 : 0.5; // 강한 상승이면 +1
            factors.push(`<span class="positive-text">구리 가격 ${copper.text}</span>`);
        } else if (copper.status === 'negative') {
            score -= 1;
            factors.push(`<span class="negative-text">구리 가격 ${copper.text}</span>`);
        } else {
            factors.push(`구리 가격 ${copper.text}`);
        }
    } else {
         factors.push("구리 가격 데이터 없음");
    }

    // 최종 예측 결과 생성
    let finalStatus, finalSignal, finalTitle, finalAnalysis;

    if (score >= 3) {
        finalStatus = 'positive';
        finalSignal = '🚀';
        finalTitle = '긍정적 전망';
        finalAnalysis = `주요 선행 지표(${factors.join(', ')})들이 강한 경기 확장 및 위험 선호 신호를 보내고 있어, S&P 500의 추가 상승이 기대됩니다.`;
    } else if (score >= 1) {
        finalStatus = 'positive';
        finalSignal = '📈';
        finalTitle = '다소 긍정적 전망';
        finalAnalysis = `선행 지표(${factors.join(', ')})들이 혼재되어 있으나, 전반적으로 경기 회복 또는 완만한 확장세를 지지하고 있어 S&P 500의 점진적 상승이 예상됩니다.`;
    } else if (score > -2) {
        finalStatus = 'neutral';
        finalSignal = '📊';
        finalTitle = '중립적/혼조 전망';
        finalAnalysis = `긍정 및 부정적 신호(${factors.join(', ')})가 혼재되어 있어 S&P 500의 뚜렷한 방향성을 예측하기 어렵습니다. 변동성 확대에 유의하며 주요 지표 변화를 주시해야 합니다.`;
    } else { // score <= -2
        finalStatus = 'negative';
        finalSignal = '📉';
        finalTitle = '부정적 전망';
        finalAnalysis = `주요 선행 지표(${factors.join(', ')})들이 경기 둔화 또는 침체 가능성을 강하게 시사하고 있어, S&P 500의 조정 또는 하락 위험이 높은 구간입니다.`;
    }

    return { 
        status: finalStatus, 
        signal: finalSignal, 
        title: finalTitle, 
        analysis: finalAnalysis
    };
}


// ==================================================================
// 자산군별 투자 의견 및 섹터 전망 (기존 함수들)
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

/**
 * 마샬케이(유동성)와 금리의 방향성을 조합하여 4가지 국면으로 분석합니다.
 */
export function analyzeMarshallKTrend(chartData, resultsObject) {
    const analysisDiv = document.getElementById('marshall-analysis');
    let result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '', analysis: '' };

    try {
        if (!chartData || chartData.length < 8) {
            throw new Error("분석할 데이터가 부족합니다.");
        }
        
        const latest = chartData[chartData.length - 1];
        const prevYear = chartData[chartData.length - 5]; 

        const mkTrend = latest.marshallK - prevYear.marshallK;
        const rateTrend = latest.interestRate - prevYear.interestRate;

        let trendText_MK = mkTrend > 0 ? "증가" : "감소";
        let trendText_Rate = rateTrend > 0 ? "상승" : "하락";

        if (rateTrend < 0 && mkTrend > 0) {
            result = { status: 'positive', outlook: '✅ 유동성 장세 (완화)', summary: '금리가 하락하고 시중 유동성이 증가하는 가장 이상적인 "금융 완화" 국면입니다. 자산 시장에 긍정적입니다.' };
        } else if (rateTrend > 0 && mkTrend > 0) {
            result = { status: 'neutral', outlook: '⚠️ 과열/버블 우려', summary: '풍부한 유동성이 인플레이션/과열 우려를 자극해 금리가 상승하는 "과열" 국면입니다. 경기 사이클 후반부 신호입니다.' };
        } else if (rateTrend > 0 && mkTrend < 0) {
            result = { status: 'negative', outlook: '🚨 금융 긴축 국면', summary: '금리가 상승하고 유동성이 축소되는 "금융 긴축" 국면입니다. 자산 시장에 가장 부정적인 환경입니다.' };
        } else {
            result = { status: 'negative', outlook: '📉 침체 국면 (바닥권)', summary: '경기 둔화로 인해 금리는 하락하지만, 신용 경색 등으로 유동성이 마르는 "침체" 국면입니다. 위험 관리가 필요합니다.' };
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
        if (!gdpObs || gdpObs.length < 13 || !pceObs || pceObs.length < 13) throw new Error("데이터 부족");
        
        const latestIdx = gdpObs.length - 1;
        const oneYearAgoIdx = latestIdx - 4;
        
        if (oneYearAgoIdx < 0) throw new Error("1년 전 데이터 부족");

        const gdpGrowth = ((parseFloat(gdpObs[latestIdx].value) / parseFloat(gdpObs[oneYearAgoIdx].value)) - 1) * 100;
        const pceGrowth = ((parseFloat(pceObs[latestIdx].value) / parseFloat(pceObs[oneYearAgoIdx].value)) - 1) * 100;

        const recentGdpGrowths = [];
        for (let i = latestIdx; i > latestIdx - 4; i--) {
            if (i < 4) break; 
            const growth = ((parseFloat(gdpObs[i].value) / parseFloat(gdpObs[i - 4].value)) - 1) * 100;
            recentGdpGrowths.push(growth);
        }
        if (recentGdpGrowths.length < 4) throw new Error("최근 4분기 성장률 계산 데이터 부족");
        const avgRecentGrowth = recentGdpGrowths.reduce((a, b) => a + b, 0) / 4;
        
        const pastGdpGrowths = [];
        for (let i = oneYearAgoIdx; i > oneYearAgoIdx - 4; i--) {
            if (i < 4) break; 
            const growth = ((parseFloat(gdpObs[i].value) / parseFloat(gdpObs[i - 4].value)) - 1) * 100;
            pastGdpGrowths.push(growth);
        }
        if (pastGdpGrowths.length < 4) throw new Error("과거 4분기 성장률 계산 데이터 부족");
        const avgPastGrowth = pastGdpGrowths.reduce((a, b) => a + b, 0) / 4;

        const trendImproving = avgRecentGrowth > avgPastGrowth;
        const trendStrength = Math.abs(avgRecentGrowth - avgPastGrowth);
        
        const veryRecentMomentum = (recentGdpGrowths[0] + recentGdpGrowths[1]) / 2;
        const slightlyOlderMomentum = (recentGdpGrowths[2] + recentGdpGrowths[3]) / 2;
        const momentumAccelerating = veryRecentMomentum > slightlyOlderMomentum;

        let trendText = trendImproving ? 
            (trendStrength > 0.5 ? "강한 상승 추세" : "완만한 상승 추세") : 
            (trendStrength > 0.5 ? "뚜렷한 하락 추세" : "완만한 하락 추세");
        let momentumText = momentumAccelerating ? "가속" : "둔화";

        if (gdpGrowth > 2.0) {
            if (trendImproving && momentumAccelerating) {
                result = { status: 'positive', outlook: '🚀 강한 확장 국면', summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 견조하며, ${trendText} + 모멘텀 ${momentumText} 중입니다.` };
            } else if (!trendImproving && !momentumAccelerating) {
                result = { status: 'neutral', outlook: '⚠️ 고점 경계 국면', summary: `GDP 성장률은 ${gdpGrowth.toFixed(2)}%로 양호하나, ${trendText} + 모멘텀 ${momentumText}로 전환되어 고점 통과 가능성이 있습니다.` };
            } else {
                result = { status: 'positive', outlook: '✅ 확장 국면', summary: `GDP 성장률 ${gdpGrowth.toFixed(2)}%로 양호한 수준이며, ${trendText}입니다.` };
            }
        } else if (gdpGrowth > 1.0) {
            if (trendImproving && momentumAccelerating) {
                result = { status: 'positive', outlook: '📈 회복 국면', summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 회복 중이며, ${trendText} + 모멘텀 ${momentumText} 중입니다.` };
            } else if (!trendImproving && !momentumAccelerating) {
                result = { status: 'negative', outlook: '📉 둔화 국면', summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 둔화되고 있으며, ${trendText} + 모멘텀 ${momentumText} 중입니다.` };
            } else {
                result = { status: 'neutral', outlook: '😐 혼조 국면', summary: `GDP 성장률 ${gdpGrowth.toFixed(2)}%이며, ${trendText}로 방향성이 불명확합니다.` };
            }
        } else if (gdpGrowth > 0) {
            if (trendImproving) {
                result = { status: 'neutral', outlook: '🌱 초기 회복 신호', summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 낮은 수준이나, ${trendText}로 회복 조짐이 보입니다.` };
            } else {
                result = { status: 'negative', outlook: '🚨 침체 우려', summary: `GDP 성장률이 ${gdpGrowth.toFixed(2)}%로 매우 낮으며, ${trendText} + 모멘텀 ${momentumText}로 침체 위험이 높습니다.` };
            }
        } else {
            result = { status: 'negative', outlook: '💥 경기 침체', summary: `GDP가 ${gdpGrowth.toFixed(2)}%로 마이너스 성장을 기록했습니다. ${trendText}입니다.` };
        }

        result.analysis = `<p><strong>최신 데이터 (${gdpObs[latestIdx].date.substring(0,7)}):</strong></p>
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

/**
 * GDP 갭의 레벨과 모멘텀(방향성)을 조합하여 분석을 세분화합니다.
 */
export function analyzeGdpGap(gdpGapData, resultsObject) {
    const analysisDiv = document.getElementById('gdp-gap-analysis');
    let result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '', analysis: '' };

    try {
        if (!gdpGapData || gdpGapData.length < 4) {
            throw new Error("분석할 데이터가 부족합니다.");
        }
        
        const latest = gdpGapData[gdpGapData.length - 1];
        const prev = gdpGapData[gdpGapData.length - 2]; 
        
        const momentum = latest.value - prev.value;
        const momentumText = momentum > 0 ? "확대" : "축소";
        
        if (latest.value > 0.5) {
            if (momentum > 0) {
                result = { status: 'negative', outlook: '🔥 과열 심화', summary: `GDP 갭(${latest.value.toFixed(2)}%)이 플러스를 기록 중이며, 갭이 더욱 확대되고 있습니다. 인플레이션 압력이 매우 높습니다.` };
            } else {
                result = { status: 'neutral', outlook: '⚠️ 정점 통과 신호', summary: `GDP 갭(${latest.value.toFixed(2)}%)이 여전히 높으나, 모멘텀이 둔화(축소)되고 있습니다. 경기 고점 통과 신호일 수 있습니다.` };
            }
        } else if (latest.value < -0.5) {
             if (momentum > 0) {
                result = { status: 'positive', outlook: '🌱 경기 회복 초기', summary: `GDP 갭(${latest.value.toFixed(2)}%)이 마이너스 상태이나, 갭이 축소(개선)되고 있습니다. 경기 회복의 초기 신호입니다.` };
            } else {
                result = { status: 'negative', outlook: '🚨 침체 심화', summary: `GDP 갭(${latest.value.toFixed(2)}%)이 마이너스를 기록 중이며, 갭이 더욱 확대(악화)되고 있습니다. 경기 침체 우려가 매우 높습니다.` };
            }
        } else {
            if (momentum > 0.1) {
                 result = { status: 'positive', outlook: '📈 확장 국면 진입', summary: `GDP 갭(${latest.value.toFixed(2)}%)이 균형 상태에서 플러스(+)로 확장되고 있습니다. 경기가 확장 국면에 진입하고 있습니다.` };
            } else if (momentum < -0.1) {
                 result = { status: 'negative', outlook: '📉 둔화 국면 진입', summary: `GDP 갭(${latest.value.toFixed(2)}%)이 균형 상태에서 마이너스(-)로 축소되고 있습니다. 경기가 둔화 국면에 진입하고 있습니다.` };
            } else {
                 result = { status: 'positive', outlook: '✅ 안정적 균형', summary: `GDP 갭(${latest.value.toFixed(2)}%)이 0에 가까우며 모멘텀도 중립적이어서 경제가 이상적인 균형 상태에 있습니다.` };
            }
        }

        result.analysis = `<p><strong>최신 데이터 (${latest.date.substring(0,7)}):</strong></p>
            <ul>
                <li>현재 GDP 갭: <strong>${latest.value.toFixed(2)}%</strong></li>
                <li>직전 분기 갭: ${prev.value.toFixed(2)}%</li>
                <li>분기 모멘텀: <strong>${momentum.toFixed(2)}%p</strong> (${momentumText} 중)</li>
            </ul>
            <p><strong>💡 종합 분석:</strong> ${result.summary}</p>`;
            
    } catch (error) {
        result.analysis = `<p class="loading-text">${error.message}</p>`;
    }
    
    if(analysisDiv) analysisDiv.innerHTML = `<div class="market-outlook-badge ${result.status}">${result.outlook}</div><div class="analysis-text">${result.analysis}</div>`;
    resultsObject.gdpGap = result;
}

/**
 * 🇰🇷 한국 경기순환지표(선행/동행)를 분석합니다.
 */
export function analyzeCycleIndicators(cycleData, resultsObject) {
    const analysisDiv = document.getElementById('cycle-analysis');
    let result = { status: 'neutral', outlook: '😐 중립적 국면', summary: '', analysis: '' };

    try {
        if (!cycleData || cycleData.leading.length < 6 || cycleData.coincident.length < 6) {
            throw new Error("분석할 경기 순환 데이터가 부족합니다.");
        }

        const latestLeading = cycleData.leading[cycleData.leading.length - 1];
        const latestCoincident = cycleData.coincident[cycleData.coincident.length - 1];
        
        const prevLeading = cycleData.leading[cycleData.leading.length - 4];
        const leadingMomentum = latestLeading.value - prevLeading.value;
        const leadingMomentumText = leadingMomentum > 0 ? "상승" : "하락";

        const level = latestLeading.value;
        const isRising = leadingMomentum > 0;

        let investmentTiming = '';

        if (level > 100 && isRising) {
            result = { status: 'positive', outlook: '✅ 경기 확장 국면', summary: '선행지수가 100을 상회하며 상승 중입니다. 경기가 활발하게 확장되고 있습니다.' };
            investmentTiming = '<b>[투자 견해]</b> 긍정적. 경기 호황이 지속되는 구간입니다. 다만, 선행지수가 고점에서 꺾이는지(경기 둔화 신호) 주의 깊게 관찰해야 합니다.';
        } else if (level > 100 && !isRising) {
            result = { status: 'negative', outlook: '📉 경기 둔화 국면', summary: '선행지수가 100을 상회하지만 하락 전환했습니다. 경기 정점(Peak)을 통과했을 가능성이 높습니다.' };
            investmentTiming = '<b>[투자 견해]</b> 부정적. 주식 비중 축소 및 현금/안전자산 확보가 필요한 시점입니다. 경기 방어주(필수소비재, 헬스케어) 비중 확대가 유리합니다.';
        } else if (level < 100 && !isRising) {
            result = { status: 'negative', outlook: '🚨 경기 침체 국면', summary: '선행지수가 100을 하회하며 하락 중입니다. 명백한 경기 침체(Recession) 신호입니다.' };
            investmentTiming = '<b>[투자 견해]</b> 매우 부정적. 위험자산 비중을 최소화하고 채권, 달러 등 안전자산 비중을 극대화해야 합니다. 경기 저점(Trough)을 기다려야 합니다.';
        } else {
            result = { status: 'positive', outlook: '🚀 경기 회복 국면', summary: '선행지수가 100을 하회하지만 상승 전환했습니다. 경기 저점(Trough)을 통과하는 가장 강력한 회복 신호입니다.' };
            investmentTiming = '<b>[투자 견해]</b> 매우 긍정적. 주식 비중을 적극적으로 확대해야 하는 "골든 크로스" 시점입니다. 경기민감주(IT, 금융, 산업재)가 시장을 주도할 수 있습니다.';
        }

        result.analysis = `<p><strong>최신 데이터 (${latestLeading.date.substring(0,4)}년 ${latestLeading.date.substring(4,6)}월):</strong></p>
            <ul>
                <li><strong>선행지수 (미래): ${latestLeading.value.toFixed(1)}</strong> (3개월 전 대비 ${leadingMomentum.toFixed(1)}p, <strong>[${leadingMomentumText} 추세]</strong>)</li>
                <li><strong>동행지수 (현재):</strong> ${latestCoincident.value.toFixed(1)}</li>
            </ul>
            <p><strong>💡 종합 분석:</strong> ${result.summary}</p>
            <p>${investmentTiming}</p>`;

    } catch (error) {
        result.analysis = `<p class="loading-text">${error.message}</p>`;
    }
    
    if(analysisDiv) analysisDiv.innerHTML = `<div class="market-outlook-badge ${result.status}">${result.outlook}</div><div class="analysis-text">${result.analysis}</div>`;
    resultsObject.cycle = result; 
}
