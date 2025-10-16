// js/analysis.js
import { fetchFredData } from './api.js';

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
            case 'sox_index':
            case 'auto_sales':
            case 'retail_sales':
            case 'home_price_index':
            case 'kospi':
                text = '시장 지수'; weight = 0;
                break;
        }
        return { ...indicator, status, icon, text, weight };
    });
}

export function getMarketOutlook(analyzedIndicators) {
    if (analyzedIndicators.length === 0) {
        return { status: 'neutral', signal: '🤔', title: '데이터 부족', analysis: '주요 지표 데이터가 부족하여 시장 전망을 분석할 수 없습니다.' };
    }

    const weightedIndicators = analyzedIndicators.filter(ind => ind.weight > 0);
    if (weightedIndicators.length === 0) {
        return { status: 'neutral', signal: '📊', title: '분석 불가', analysis: '전망을 분석하는 데 사용되는 주요 지표를 불러오지 못했습니다.' };
    }

    const totalWeight = weightedIndicators.reduce((sum, ind) => sum + ind.weight, 0);
    let score = 0;

    weightedIndicators.forEach(ind => {
        if (ind.status === 'positive') score += ind.weight;
        else if (ind.status === 'negative') score -= ind.weight;
    });
    
    const outlookScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;
    
    const positiveSignals = weightedIndicators.filter(i => i.status === 'positive').sort((a,b) => b.weight - a.weight).slice(0, 3);
    const negativeSignals = weightedIndicators.filter(i => i.status === 'negative').sort((a,b) => b.weight - a.weight).slice(0, 3);

    const formatSignalText = (signals) => {
        if (signals.length === 0) return '';
        return signals.map(s => s.name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim()).join(', ');
    };

    let analysisText;
    if (outlookScore > 30) {
        analysisText = `주요 경제 지표들이 견조한 모습을 보이고 있습니다. 특히 긍정적인 신호를 보내고 있는 <b>${formatSignalText(positiveSignals)}</b> 등이 경기 회복과 증시 상승에 대한 기대감을 높이고 있습니다. 위험자산 선호 심리가 강화될 수 있습니다.`;
        return { status: 'positive', signal: '📈', title: '긍정적 전망', analysis: analysisText };
    } else if (outlookScore < -30) {
        analysisText = `여러 경제 지표에서 경고 신호가 나타나고 있습니다. 특히 <b>${formatSignalText(negativeSignals)}</b> 등에서 나타난 우려가 경기 둔화 및 침체 가능성을 높이고 있어, 안전자산 선호 심리가 강해질 수 있습니다.`;
        return { status: 'negative', signal: '📉', title: '부정적 전망', analysis: analysisText };
    } else {
        const positiveText = formatSignalText(positiveSignals);
        const negativeText = formatSignalText(negativeSignals);
        analysisText = `긍정적 지표와 부정적 지표가 혼재되어 명확한 방향성을 보이지 않고 있습니다.`;
        if (positiveText) {
            analysisText += `<br><br><b>[긍정 요인]</b> ${positiveText} 등은 시장에 긍정적인 영향을 주고 있습니다.`
        }
        if (negativeText) {
             analysisText += `<br><b>[부정 요인]</b> 반면, ${negativeText} 등은 부담으로 작용하고 있습니다.`
        }
        analysisText += `<br><br>당분간 시장은 변동성을 보이며 횡보할 가능성이 있습니다.`;
        return { status: 'neutral', signal: '📊', title: '혼조세 전망', analysis: analysisText };
    }
}

export function analyzeMarshallKTrend(chartData) {
    const analysisDiv = document.getElementById('marshall-analysis');
    if (!chartData || chartData.length < 8) {
        analysisDiv.innerHTML = '<p class="loading-text">분석할 데이터가 부족합니다.</p>';
        return;
    }

    const recentData = chartData.slice(-8);
    const currentMarshallK = recentData[recentData.length - 1].marshallK;
    const currentRate = recentData[recentData.length - 1].interestRate;
    
    const oneYearAgo = recentData[recentData.length - 5];
    const marshallKChange = currentMarshallK - oneYearAgo.marshallK;
    const rateChange = currentRate - oneYearAgo.interestRate;
    
    const avgMarshallK = chartData.reduce((sum, d) => sum + d.marshallK, 0) / chartData.length;
    const marshallKDeviation = ((currentMarshallK - avgMarshallK) / avgMarshallK) * 100;
    
    const maxMarshallK = Math.max(...chartData.map(d => d.marshallK));
    const marshallKFromPeak = ((currentMarshallK - maxMarshallK) / maxMarshallK) * 100;
    
    let marketOutlook = '';
    let outlookClass = '';
    let analysis = '';
    
    if (currentMarshallK > avgMarshallK && currentRate > 3.5) {
        marketOutlook = '🚨 경기 둔화 및 자산 버블 우려';
        outlookClass = 'warning';
        analysis = `
            <p><strong>현재 상황:</strong></p>
            <ul>
                <li>마샬케이: <strong>${currentMarshallK.toFixed(2)}</strong> (역사적 평균 대비 <strong>${marshallKDeviation > 0 ? '+' : ''}${marshallKDeviation.toFixed(1)}%</strong>)</li>
                <li>10년물 국채 금리: <strong>${currentRate.toFixed(2)}%</strong> (1년 전 대비 <strong>${rateChange > 0 ? '+' : ''}${rateChange.toFixed(2)}%p</strong>)</li>
            </ul>
            <p><strong>⚠️ 위험 신호:</strong></p>
            <ul>
                <li><strong>유동성 과잉:</strong> 마샬케이가 역사적 평균보다 높아 시중에 통화가 과도하게 공급된 상태입니다.</li>
                <li><strong>긴축 정책의 지연 효과:</strong> 높은 금리에도 불구하고 마샬케이가 높다는 것은 금리 인상의 효과가 아직 경제 전반에 충분히 반영되지 않았음을 의미합니다.</li>
                <li><strong>역사적 패턴:</strong> 2008년 금융위기 전에도 유사한 패턴(높은 마샬케이 + 금리 인상)이 관찰되었습니다.</li>
            </ul>
            <p><strong>📉 투자 전략 제안:</strong></p>
            <ul>
                <li><strong>방어적 포지션:</strong> 성장주보다는 배당주, 필수소비재 등 방어주 중심으로 포트폴리오를 재구성하는 것이 안전합니다.</li>
                <li><strong>현금 비중 확대:</strong> 향후 조정 시 매수 기회를 위해 현금 비중을 30-40% 이상 유지하는 것이 유리합니다.</li>
            </ul>
        `;
    }
    else if (marshallKChange < 0 && rateChange < 0) {
        marketOutlook = '✅ 경기 회복 초기 신호';
        outlookClass = 'positive';
        analysis = `
            <p><strong>현재 상황:</strong></p>
            <ul>
                <li>마샬케이: <strong>${currentMarshallK.toFixed(2)}</strong> (1년 전 대비 <strong>${marshallKChange.toFixed(2)} 하락</strong>)</li>
                <li>10년물 국채 금리: <strong>${currentRate.toFixed(2)}%</strong> (1년 전 대비 <strong>${rateChange.toFixed(2)}%p 하락</strong>)</li>
            </ul>
            <p><strong>✅ 긍정적 신호:</strong></p>
            <ul>
                <li><strong>유동성 정상화:</strong> 마샬케이 하락은 과잉 유동성이 해소되고 있음을 의미합니다.</li>
                <li><strong>금리 인하 사이클:</strong> 금리 하락은 기업의 자금 조달 비용이 낮아져 투자와 소비가 증가할 수 있습니다.</li>
            </ul>
            <p><strong>📈 투자 전략 제안:</strong></p>
            <ul>
                <li><strong>성장주 관심:</strong> 금리 하락은 성장주에 유리한 환경이며, 기술주와 신산업 섹터에 대한 비중 확대를 고려할 수 있습니다.</li>
                <li><strong>분할 매수:</strong> 아직 초기 신호이므로 3-6개월에 걸쳐 분할 매수하는 것이 안전합니다.</li>
            </ul>
        `;
    }
    else if (marshallKFromPeak > -5) {
        marketOutlook = '⚠️ 유동성 피크, 조정 가능성 주의';
        outlookClass = 'warning';
        analysis = `
            <p><strong>현재 상황:</strong></p>
            <ul>
                <li>마샬케이: <strong>${currentMarshallK.toFixed(2)}</strong> (역사적 최고점 대비 <strong>${Math.abs(marshallKFromPeak).toFixed(1)}%</strong> 하락)</li>
                <li>10년물 국채 금리: <strong>${currentRate.toFixed(2)}%</strong></li>
            </ul>
            <p><strong>⚠️ 주의 신호:</strong></p>
            <ul>
                <li><strong>유동성 최고점:</strong> 시중 유동성이 극대화된 상태로, 더 이상의 상승 여력이 제한적일 수 있습니다.</li>
                <li><strong>조정 가능성:</strong> 마샬케이가 정점을 찍은 후 6-18개월 내에 시장 조정이 발생하는 경우가 많았습니다.</li>
            </ul>
            <p><strong>📊 투자 전략 제안:</strong></p>
            <ul>
                <li><strong>이익 실현:</strong> 큰 수익을 본 종목은 일부 이익 실현을 통해 리스크를 줄이는 것이 현명합니다.</li>
                <li><strong>단기 트레이딩:</strong> 장기 투자보다는 단기 관점에서 접근하고, 손절매 원칙을 엄격히 지켜야 합니다.</li>
            </ul>
        `;
    }
    else {
        marketOutlook = '😐 중립적 국면, 신중한 관찰 필요';
        outlookClass = 'neutral';
        analysis = `
            <p><strong>현재 상황:</strong></p>
            <ul>
                <li>마샬케이: <strong>${currentMarshallK.toFixed(2)}</strong> (역사적 평균 대비 <strong>${marshallKDeviation > 0 ? '+' : ''}${marshallKDeviation.toFixed(1)}%</strong>)</li>
                <li>10년물 국채 금리: <strong>${currentRate.toFixed(2)}%</strong></li>
            </ul>
            <p><strong>📊 현재 평가:</strong></p>
            <ul>
                <li><strong>과도기 국면:</strong> 시장이 명확한 방향성을 찾지 못하고 있습니다.</li>
                <li><strong>관망 필요:</strong> 향후 2-3개 분기 동안의 추세 변화를 주의 깊게 관찰해야 합니다.</li>
            </ul>
            <p><strong>⚖️ 투자 전략 제안:</strong></p>
            <ul>
                <li><strong>균형 포트폴리오:</strong> 성장주와 가치주, 국내외 자산을 적절히 배분하여 리스크를 분산하세요.</li>
                <li><strong>선별적 투자:</strong> 펀더멘털이 우수한 개별 종목에 집중하는 것이 유리합니다.</li>
            </ul>
        `;
    }
    
    analysisDiv.innerHTML = `
        <div class="market-outlook-badge ${outlookClass}">${marketOutlook}</div>
        <div class="analysis-text">${analysis}</div>
        <p class="analysis-footnote">
            <strong>참고:</strong> 마샬케이(Marshall K-ratio)는 통화량(M2)을 GDP로 나눈 값으로, 경제 내 유동성 수준을 나타냅니다. 
        </p>
    `;
}

export async function analyzeGdpConsumption() {
    const analysisDiv = document.getElementById('gdp-consumption-analysis');
    try {
        const [gdpObs, pceObs] = await Promise.all([
            fetchFredData('GDPC1', 5, 'desc'), 
            fetchFredData('PCEC', 5, 'desc')   
        ]);

        if (!gdpObs || gdpObs.length < 5 || !pceObs || pceObs.length < 5) {
            throw new Error("GDP 또는 PCE 데이터를 충분히 가져오지 못했습니다.");
        }
        
        const currentGdp = parseFloat(gdpObs[0].value);
        const prevYearGdp = parseFloat(gdpObs[4].value);
        const gdpGrowth = ((currentGdp / prevYearGdp) - 1) * 100;
        
        const currentPce = parseFloat(pceObs[0].value);
        const prevYearPce = parseFloat(pceObs[4].value);
        const pceGrowth = ((currentPce / prevYearPce) - 1) * 100;
        
        const latestDate = gdpObs[0].date;

        let outlook = '😐 중립적 국면';
        let outlookClass = 'neutral';
        let analysis = `
            <p><strong>최신 데이터 (${latestDate.substring(0,7)}) - 전년 동기 대비:</strong></p>
            <ul>
                <li>실질 GDP 성장률: <strong>${gdpGrowth.toFixed(2)}%</strong></li>
                <li>실질 PCE(소비) 성장률: <strong>${pceGrowth.toFixed(2)}%</strong></li>
            </ul>
        `;

        if (gdpGrowth > 1.5 && pceGrowth > 1.5) {
            outlook = '✅ 확장 국면';
            outlookClass = 'positive';
            analysis += `<p><strong>분석:</strong> GDP와 소비 모두 견조하게 상승하며 <strong>경기 확장 국면</strong>에 있음을 시사합니다.</p>`;
        } else if (gdpGrowth < 0 && pceGrowth < 0) {
            outlook = '🚨 경기 침체 국면';
            outlookClass = 'negative';
            analysis += `<p><strong>분석:</strong> GDP와 소비 모두 마이너스 성장을 기록하며 <strong>경기 침체</strong>에 진입했음을 시사합니다.</p>`;
        } else if (gdpGrowth > pceGrowth && gdpGrowth > 0.5) {
            outlook = '⚠️ 소비 둔화 우려';
            outlookClass = 'warning';
            analysis += `<p><strong>분석:</strong> 소비 성장률이 GDP보다 낮아지며 <strong>소비 둔화 우려</strong>가 커지고 있습니다.</p>`;
        } else if (pceGrowth > gdpGrowth && pceGrowth > 0.5) {
            outlook = '📈 소비 주도 회복 기대';
            outlookClass = 'positive';
            analysis += `<p><strong>분석:</strong> 소비 성장률이 GDP 성장률을 상회하며 <strong>소비 주도의 경기 회복 기대감</strong>이 높습니다.</p>`;
        } else {
             analysis += `<p><strong>분석:</strong> 시장이 방향성을 탐색하는 <strong>중립적 국면</strong>에 있습니다.</p>`;
        }
        
        analysisDiv.innerHTML = `
            <div class="market-outlook-badge ${outlookClass}">${outlook}</div>
            <div class="analysis-text">${analysis}</div>
        `;

    } catch (error) {
        console.error("GDP/소비 분석 실패:", error);
        analysisDiv.innerHTML = '<p style="color:#dc3545;">GDP/소비 데이터 분석에 실패했습니다.</p>';
    }
}

/**
 * GDP 갭 데이터를 분석하여 결과를 HTML에 렌더링합니다.
 * @param {Array<object>} gdpGapData - {date, value} 형태의 GDP 갭 데이터 배열.
 */
export function analyzeGdpGap(gdpGapData) {
    const analysisDiv = document.getElementById('gdp-gap-analysis');
    if (!analysisDiv) return; // 분석을 표시할 div가 없으면 종료

    if (!gdpGapData || gdpGapData.length < 2) {
        analysisDiv.innerHTML = '<p class="loading-text">분석할 데이터가 부족합니다.</p>';
        return;
    }

    const latestGap = gdpGapData[gdpGapData.length - 1];
    const previousGap = gdpGapData[gdpGapData.length - 2];
    const trend = latestGap.value - previousGap.value; // 최근 추세

    let outlook = '';
    let outlookClass = 'neutral';
    let analysis = `
        <p><strong>최신 데이터 (${latestGap.date.substring(0, 7)}):</strong></p>
        <ul>
            <li>현재 GDP 갭: <strong>${latestGap.value.toFixed(2)}%</strong></li>
            <li>최근 분기 변동: <strong>${trend > 0 ? '▲' : '▼'} ${Math.abs(trend).toFixed(2)}%p</strong></li>
        </ul>
    `;

    if (latestGap.value > 0.5) {
        outlook = '🔥 인플레이션 압력';
        outlookClass = 'negative';
        analysis += `<p><strong>분석:</strong> 잠재 GDP를 초과하는 생산이 이루어지고 있어 <strong>수요 견인 인플레이션 압력</strong>이 높아진 상태입니다. 연준의 긴축 정책이 지속될 수 있습니다.</p>`;
    } else if (latestGap.value < -0.5) {
        outlook = '📉 경기 침체 우려';
        outlookClass = 'negative';
        analysis += `<p><strong>분석:</strong> 잠재 GDP에 미치지 못하는 생산으로 인해 <strong>경기 둔화 또는 침체 우려</strong>가 있습니다. 실업률이 상승하고 디플레이션 압력이 나타날 수 있습니다.</p>`;
    } else {
        outlook = '✅ 안정적인 상태';
        outlookClass = 'positive';
        analysis += `<p><strong>분석:</strong> 실제 GDP가 잠재 GDP 수준에서 안정적으로 움직이고 있어 <strong>경제가 균형 상태</strong>에 가까움을 시사합니다. 물가와 고용이 안정될 가능성이 높습니다.</p>`;
    }

    if (trend > 0.2) {
        analysis += `<p><strong>추세:</strong> 갭이 플러스(+) 방향으로 빠르게 확대되고 있어 향후 인플레이션 압력이 더욱 커질 수 있습니다.</p>`;
    } else if (trend < -0.2) {
        analysis += `<p><strong>추세:</strong> 갭이 마이너스(-) 방향으로 빠르게 확대되고 있어 경기 둔화 속도가 빨라질 수 있습니다.</p>`;
    }

    analysisDiv.innerHTML = `
        <div class="market-outlook-badge ${outlookClass}">${outlook}</div>
        <div class="analysis-text">${analysis}</div>
         <p class="analysis-footnote">
            <strong>참고:</strong> GDP 갭은 (실질 GDP / 잠재 GDP - 1) * 100으로 계산되며, 경제의 과열 또는 침체 상태를 판단하는 데 사용됩니다.
        </p>
    `;
}
