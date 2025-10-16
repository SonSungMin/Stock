// enhanced_analysis.js
// 기존 analysis.js의 분석 기능을 확장한 버전

export function getDetailedMarketOutlook(analyzedIndicators, macroResults) {
    if (!analyzedIndicators) analyzedIndicators = [];
    
    // 1. 지표별 신호 강도 계산
    const signalStrength = analyzeSignalStrength(analyzedIndicators);
    
    // 2. 경제 사이클 판단
    const economicCycle = determineEconomicCycle(analyzedIndicators, macroResults);
    
    // 3. 리스크 평가
    const riskAssessment = assessMarketRisks(analyzedIndicators, macroResults);
    
    // 4. 투자 포지셔닝
    const investmentPositioning = getInvestmentPositioning(signalStrength, economicCycle, riskAssessment);
    
    // 5. 단기/중기 시나리오
    const scenarios = generateScenarios(analyzedIndicators, macroResults);
    
    return {
        signalStrength,
        economicCycle,
        riskAssessment,
        investmentPositioning,
        scenarios,
        detailedAnalysis: buildDetailedAnalysis(analyzedIndicators, macroResults, signalStrength, economicCycle, riskAssessment)
    };
}

function analyzeSignalStrength(indicators) {
    const categorySignals = {};
    
    // 그룹별 신호 분류
    const groups = {
        '금리/채권': ['yield_spread', 'base_rate'],
        '통화/환율': ['exchange_rate', 'dollar_index'],
        '변동성/공포': ['vix', 'corp_bond_spread'],
        '에너지/원자재': ['wti_price'],
        '성장': ['gdp_growth', 'export_growth', 'industrial_production'],
        '물가': ['cpi', 'us_cpi', 'producer_price_index'],
        '고용': ['nfp', 'unemployment'],
        '소비/심리': ['consumer_sentiment', 'auto_sales', 'retail_sales'],
        '기술': ['sox_index'],
        '주택': ['home_price_index']
    };

    for (const [group, ids] of Object.entries(groups)) {
        const groupIndicators = indicators.filter(i => i && ids.includes(i.id));
        if (groupIndicators.length === 0) continue;

        const positiveCount = groupIndicators.filter(i => i.status === 'positive').length;
        const negativeCount = groupIndicators.filter(i => i.status === 'negative').length;
        const neutralCount = groupIndicators.filter(i => i.status === 'neutral').length;
        const strength = ((positiveCount - negativeCount) / groupIndicators.length) * 100;

        categorySignals[group] = {
            score: strength,
            positive: positiveCount,
            negative: negativeCount,
            neutral: neutralCount,
            total: groupIndicators.length,
            signal: strength > 30 ? '긍정' : (strength < -30 ? '부정' : '혼합'),
            indicators: groupIndicators.map(i => ({
                name: i.name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim(),
                status: i.status,
                text: i.text,
                value: i.value
            }))
        };
    }

    return categorySignals;
}

function determineEconomicCycle(indicators, macroResults) {
    // 경제 사이클 판단: 회복기, 확장기, 정점, 침체기
    
    let recoverySignals = 0;
    let expansionSignals = 0;
    let contractionSignals = 0;
    
    // 금리 정책 신호
    const baseRate = indicators.find(i => i && i.id === 'base_rate');
    const yieldSpread = indicators.find(i => i && i.id === 'yield_spread');
    
    if (baseRate?.status === 'positive') recoverySignals += 2;
    if (yieldSpread?.status === 'positive') expansionSignals += 2;
    if (yieldSpread?.status === 'negative') contractionSignals += 3; // 수익률 역전 = 강한 경고
    
    // 성장 신호
    const gdpGrowth = indicators.find(i => i && i.id === 'gdp_growth');
    const exportGrowth = indicators.find(i => i && i.id === 'export_growth');
    const nfp = indicators.find(i => i && i.id === 'nfp');
    
    if (gdpGrowth?.status === 'positive') expansionSignals += 2;
    if (gdpGrowth?.status === 'negative') contractionSignals += 2;
    if (exportGrowth?.status === 'positive') expansionSignals += 1.5;
    if (nfp?.status === 'positive') expansionSignals += 1;
    if (nfp?.status === 'negative') contractionSignals += 1.5;
    
    // 물가 신호
    const cpi = indicators.find(i => i && i.id === 'cpi');
    if (cpi?.status === 'negative') contractionSignals += 0.5;
    if (cpi?.status === 'positive') recoverySignals += 1;
    
    // 거시 분석 결과 반영
    if (macroResults.marshallK?.status === 'negative') contractionSignals += 2;
    if (macroResults.gdpGap?.status === 'negative') contractionSignals += 1.5;
    if (macroResults.gdpConsumption?.status === 'positive') expansionSignals += 1;
    
    let cycle = '';
    let cycleForecast = '';
    
    if (contractionSignals > 5) {
        cycle = '🔴 침체기';
        cycleForecast = '경기 둔화 우려가 높아 방어적 포지셔닝 권장';
    } else if (expansionSignals > 5) {
        cycle = '🟢 확장기';
        cycleForecast = '경기 확장 기대감으로 공격적 포지셔닝 가능';
    } else if (recoverySignals > 3) {
        cycle = '🟡 회복기';
        cycleForecast = '금융 완화 기조로 회복 초기 신호 포착';
    } else {
        cycle = '⚪ 전환기';
        cycleForecast = '명확한 방향성 없이 시장 변동성 예상';
    }
    
    return {
        cycle,
        cycleForecast,
        scores: {
            recovery: recoverySignals,
            expansion: expansionSignals,
            contraction: contractionSignals
        }
    };
}

function assessMarketRisks(indicators, macroResults) {
    const risks = [];
    let totalRiskScore = 0;
    
    // 금리 위험
    const yieldSpread = indicators.find(i => i && i.id === 'yield_spread');
    if (yieldSpread?.status === 'negative') {
        risks.push({
            category: '금리 역전 위험',
            level: '⚠️ 높음',
            description: `장단기 금리 역전(${yieldSpread.value}%)이 경기 침체 신호로 해석되고 있습니다.`,
            score: 3
        });
        totalRiskScore += 3;
    }
    
    // 신용 위험
    const corpBondSpread = indicators.find(i => i && i.id === 'corp_bond_spread');
    if (corpBondSpread?.status === 'negative') {
        risks.push({
            category: '신용 위험 확대',
            level: '🚨 매우 높음',
            description: `회사채 스프레드(${corpBondSpread.value}${corpBondSpread.unit})가 상승하여 신용 불안 신호입니다.`,
            score: 3
        });
        totalRiskScore += 3;
    }
    
    // 변동성 위험
    const vix = indicators.find(i => i && i.id === 'vix');
    if (vix?.status === 'negative') {
        risks.push({
            category: '시장 변동성 증가',
            level: '⚠️ 높음',
            description: `VIX 지수(${vix.value})가 상승하여 시장 공포심이 확대되고 있습니다.`,
            score: 2
        });
        totalRiskScore += 2;
    }
    
    // 환율 위험
    const exchangeRate = indicators.find(i => i && i.id === 'exchange_rate');
    if (exchangeRate?.status === 'negative') {
        risks.push({
            category: '원화 약세 위험',
            level: '⚠️ 중간',
            description: `원/달러 환율(${exchangeRate.value}${exchangeRate.unit})이 상승하여 수입 인플레이션 위험입니다.`,
            score: 1.5
        });
        totalRiskScore += 1.5;
    }
    
    // 거시 위험
    if (macroResults.marshallK?.status === 'negative') {
        risks.push({
            category: '과잉 유동성/인플레 우려',
            level: '🚨 매우 높음',
            description: '높은 마샬케이와 금리 수준이 경기 둔화를 시사합니다.',
            score: 2.5
        });
        totalRiskScore += 2.5;
    }
    
    if (macroResults.gdpGap?.status === 'negative') {
        risks.push({
            category: '경기 갭 부정적',
            level: '⚠️ 높음',
            description: 'GDP 갭이 마이너스로 경기가 잠재 성장률 이하입니다.',
            score: 2
        });
        totalRiskScore += 2;
    }
    
    const riskLevel = totalRiskScore > 8 ? '🔴 매우 높음' : 
                      totalRiskScore > 5 ? '🟠 높음' : 
                      totalRiskScore > 2 ? '🟡 중간' : '🟢 낮음';
    
    return {
        risks,
        totalScore: totalRiskScore,
        level: riskLevel,
        summary: risks.length > 0 ? 
            `${risks.length}가지 주요 위험요소 감지됨` : 
            '현재 시점에서 주요 위험요소 없음'
    };
}

function getInvestmentPositioning(signalStrength, economicCycle, riskAssessment) {
    const positioning = {
        stocks: {},
        bonds: {},
        alternativeAssets: {},
        overallStrategy: ''
    };
    
    const cycleType = economicCycle.cycle;
    
    // 확장기 전략
    if (cycleType.includes('확장기')) {
        positioning.stocks = {
            stance: '📈 강화',
            detail: '경기 확장기로 주식 비중 확대 권장',
            target: '70-80%'
        };
        positioning.bonds = {
            stance: '⚖️ 유지',
            detail: '인플레이션 압력 주의하며 듀레이션 단축 권고',
            target: '15-20%'
        };
        positioning.alternativeAssets = {
            stance: '🛢️ 강화',
            detail: '원자재와 인프라 투자 기회 활용',
            target: '5-10%'
        };
        positioning.overallStrategy = '공격적 성장 포지셔닝 (Growth positioning)';
    }
    // 침체기 전략
    else if (cycleType.includes('침체기')) {
        positioning.stocks = {
            stance: '📉 축소',
            detail: '기업 실적 부진 우려로 주식 비중 축소',
            target: '40-50%'
        };
        positioning.bonds = {
            stance: '🛡️ 강화',
            detail: '안전자산인 채권 비중 확대, 금리 인상 기대 활용',
            target: '35-45%'
        };
        positioning.alternativeAssets = {
            stance: '✨ 강화',
            detail: '금, 달러 등 안전자산 선호',
            target: '10-15%'
        };
        positioning.overallStrategy = '방어적 안정 포지셔닝 (Defensive positioning)';
    }
    // 회복기/전환기
    else {
        positioning.stocks = {
            stance: '📊 중립',
            detail: '섹터별 차별화 전략으로 그로스 기회 포착',
            target: '60%'
        };
        positioning.bonds = {
            stance: '⚖️ 유지',
            detail: '금리 경로 불확실성으로 중기채 위주 구성',
            target: '25%'
        };
        positioning.alternativeAssets = {
            stance: '🔄 보수적',
            detail: '분산 투자 목적의 대체자산 활용',
            target: '15%'
        };
        positioning.overallStrategy = '균형적 기회 포지셔닝 (Balanced opportunity)';
    }
    
    return positioning;
}

function generateScenarios(indicators, macroResults) {
    return {
        bullish: {
            title: '🟢 긍정 시나리오 (확률 30-40%)',
            description: '금리 인상 중단 및 경기 회복 신호 강화',
            triggers: [
                '연준의 금리 인상 중단 선언',
                '기업 실적 개선 확인',
                '소비 심리 반등',
                '수출 회복세 지속'
            ],
            impact: '주식 15-25% 상승, 채권 수익률 상승'
        },
        bearish: {
            title: '🔴 부정 시나리오 (확률 25-35%)',
            description: '경기 침체 심화 및 금융 불안 확산',
            triggers: [
                '신용 시장 경색 심화',
                '실업률 상승 추세 지속',
                '기업 도산 증가',
                '글로벌 위험자산 선도 매도'
            ],
            impact: '주식 20-30% 하락, 채권으로의 안전자산 선호'
        },
        basecase: {
            title: '🟡 기본 시나리오 (확률 40-50%)',
            description: '저성장 기조 지속 및 완만한 조정',
            triggers: [
                '금리 인상 일시 중단',
                '경기 완만한 회복',
                '인플레이션 서서히 진정',
                '기업 실적 횡보'
            ],
            impact: '주식 5-10% 변동성, 채권 안정적 수익'
        }
    };
}

function buildDetailedAnalysis(indicators, macroResults, signalStrength, economicCycle, riskAssessment) {
    let analysis = '';
    
    analysis += `<h4 style="color: #0056b3; margin-bottom: 15px;">📊 현재 시장 상황 평가</h4>`;
    analysis += `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">`;
    analysis += `<p><strong>경제 사이클:</strong> ${economicCycle.cycle}</p>`;
    analysis += `<p><strong>판단:</strong> ${economicCycle.cycleForecast}</p>`;
    analysis += `<p><strong>시장 위험:</strong> ${riskAssessment.level}</p>`;
    analysis += `</div>`;
    
    analysis += `<h4 style="color: #0056b3; margin-bottom: 15px;">🎯 카테고리별 신호 분석</h4>`;
    for (const [category, signal] of Object.entries(signalStrength)) {
        const indicator_text = signal.indicators.map(i => 
            `${i.name}(${i.text})`
        ).join(', ');
        
        let bgColor = signal.score > 30 ? '#d4edda' : (signal.score < -30 ? '#f8d7da' : '#fff3cd');
        const positiveCount = signal.positive;
        const negativeCount = signal.negative;
        const neutralCount = signal.neutral;
        analysis += `
            <div style="background-color: ${bgColor}; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                <strong>${category}:</strong> ${signal.signal} 
                (긍정 ${positiveCount}/부정 ${negativeCount}/중립 ${neutralCount}) - ${indicator_text}
            </div>
        `;
    }
    
    analysis += `<h4 style="color: #0056b3; margin-bottom: 15px;">⚠️ 주요 위험요소</h4>`;
    if (riskAssessment.risks.length > 0) {
        analysis += '<ul>';
        riskAssessment.risks.forEach(risk => {
            analysis += `<li><strong>${risk.category} ${risk.level}</strong>: ${risk.description}</li>`;
        });
        analysis += '</ul>';
    } else {
        analysis += '<p style="color: #28a745;">현재 주요 위험요소 없음</p>';
    }
    
    analysis += `<h4 style="color: #0056b3; margin-bottom: 15px;">💡 투자 전략</h4>`;
    analysis += `<p>추천 포지셔닝: <strong>${economicCycle.cycle}</strong>에 맞춘 <strong>${signalStrength}</strong></p>`;
    
    return analysis;
}
