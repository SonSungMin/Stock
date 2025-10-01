// ==================================================================
// API 키와 프록시 URL 설정
// ==================================================================
const API_KEYS = {
    FRED: '480b8d74e3d546674e8180193c30dbf6', // 실제 FRED API 키로 교체해야 합니다.
    ECOS: 'C4UHXGGIUUZ1TNZJOXFM'      // 실제 한국은행 ECOS API 키로 교체해야 합니다.
};
const PROXY_URL = '/.netlify/functions/proxy?targetUrl=';
const STOCK_INFO_URL = '/.netlify/functions/stock-info?code=';


let indicatorChart = null; // 차트 인스턴스를 저장할 전역 변수
let stockPriceChart = null;
let stockFinanceChart = null;


// ==================================================================
// 지표 상세 정보 (설명, 판단 기준, FRED Series ID 등)
// ==================================================================
const indicatorDetails = {
    yield_spread: {
        title: '🇺🇸 장단기 금리차 (Yield Spread)',
        description: '미래 경기를 예측하는 핵심 선행 지표입니다. 보통 10년 만기 국채 금리에서 2년 만기 국채 금리를 빼서 계산하며, 이 금리차가 마이너스(-)로 떨어지는 \'금리 역전\' 현상은 미래 경기 침체의 강력한 경고 신호로 해석됩니다.',
        criteria: [
            '✅ <b>정상 범위 (0 이상):</b> 경제의 안정적인 확장을 기대하는 상태입니다.',
            '⚠️ <b>역전폭 축소 (-0.1 ~ 0):</b> 경기 침체 우려가 일부 완화되었지만 여전히 불안한 상태입니다.',
            '🚨 <b>경기 침체 우려 (-0.1 미만):</b> 가까운 미래에 경기 침체가 올 가능성이 매우 높다고 시장이 판단하는 상태입니다.'
        ],
        seriesId: ['DGS10', 'DGS2'], // 10년물, 2년물
        related_stocks: {
            '금리 역전 시 (부정적)': '경기민감주 (화학, 철강, IT), 금융주',
            '금리차 확대 시 (긍정적)': '성장주, 기술주'
        }
    },
    gdp_growth: {
        title: '🇰🇷 GDP 성장률',
        description: '한 나라의 경제 규모가 이전 분기에 비해 얼마나 성장했는지를 보여주는 가장 대표적인 경제 지표입니다. GDP가 꾸준히 성장한다는 것은 국가 경제가 활발하게 움직이고 있다는 의미입니다.',
        criteria: [
            '👍 <b>견조한 회복세 (0.7% 이상):</b> 경제가 예상보다 강하게 성장하고 있음을 의미합니다.',
            '😐 <b>완만한 성장 (0.3% ~ 0.7%):</b> 경제가 안정적으로 성장하고 있음을 의미합니다.',
            '👎 <b>성장 둔화 우려 (0.3% 미만):</b> 경제 성장 동력이 약해지고 있음을 의미하며, 경기 둔화의 신호일 수 있습니다.'
        ],
        seriesId: 'KORGDPRQDSMEI'
    },
    export_growth: {
        title: '🇰🇷 수출 증가율',
        description: '대한민국 경제의 핵심 동력인 수출이 얼마나 늘고 줄었는지를 보여줍니다. 수출이 잘 되어야 기업들의 생산과 투자가 늘고, 일자리도 증가하는 선순환이 일어납니다.',
        criteria: [
            '📈 <b>플러스 전환 (2.0% 이상):</b> 수출이 강하게 회복되고 있으며, 경제 전반에 긍정적인 영향을 줍니다.',
            '📊 <b>소폭 개선 (0% ~ 2.0%):</b> 수출이 부진에서 벗어나 점차 개선되고 있음을 의미합니다.',
            '📉 <b>수출 부진 (0% 미만):</b> 수출이 감소하고 있어 기업 실적과 경제 성장에 부담을 줍니다.'
        ],
        seriesId: 'XTEXVA01KRQ667S',
        related_stocks: {
            '수출 증가 시': '반도체, 자동차, 화학 등 수출주',
            '수출 부진 시': '내수주, 경기방어주'
        }
    },
    cpi: {
        title: '🇰🇷 소비자물가지수 (CPI)',
        description: '소비자가 일상생활에서 구매하는 상품과 서비스의 가격 변동을 나타내는 지표로, 인플레이션 수준을 측정하는 데 사용됩니다. 물가가 너무 가파르게 오르면 가계의 실질 소득이 줄어 소비가 위축될 수 있습니다.',
        criteria: [
            '😌 <b>물가 안정세 (3.0% 이하):</b> 물가가 관리 가능한 범위 내에서 안정적으로 움직이고 있습니다.',
            '😐 <b>인플레이션 둔화 (3.0% ~ 4.0%):</b> 물가 상승 압력이 다소 완화되었지만 여전히 높은 수준입니다.',
            '🔥 <b>물가 압력 지속 (4.0% 초과):</b> 높은 물가 상승으로 인해 가계 부담이 커지고 중앙은행의 금리 인상 가능성이 높아집니다.'
        ]
        // ECOS 데이터 사용, FRED ID 없음
    },
    unemployment: {
        title: '🇰🇷 실업률',
        description: '경제활동인구 중에서 실업자가 차지하는 비율을 나타냅니다. 실업률이 낮다는 것은 고용 시장이 안정되어 있고, 가계 소득이 튼튼해져 소비가 늘어날 수 있다는 긍정적인 신호입니다.',
        criteria: [
            '💪 <b>완전고용 수준 (3.0% 이하):</b> 고용 시장이 매우 안정적이고 건강한 상태입니다.',
            '😥 <b>고용 시장 악화 (3.0% 초과):</b> 일자리를 찾는 사람이 늘어나고 있어 경기 둔화의 신호일 수 있습니다.'
        ],
        seriesId: 'LRUNTTTTKRM156S'
    },
    base_rate: {
        title: '🇰🇷 기준금리',
        description: '중앙은행(한국은행)이 결정하는 정책 금리로, 시중 금리의 기준이 됩니다. 금리가 낮으면 시중에 돈이 많이 풀려 경기가 활성화되고(긍정), 높으면 긴축 효과로 경기가 둔화될 수 있습니다(부정).',
        criteria: [
            '💰 <b>완화적 통화정책 (2.5% 이하):</b> 경기 부양을 위해 금리를 낮은 수준으로 유지하고 있음을 의미합니다.',
            '⚖️ <b>중립적 금리 수준 (2.5% ~ 3.5%):</b> 경제가 안정적이라고 판단하여 금리를 중립적인 수준으로 유지하고 있음을 의미합니다.',
            '🔒 <b>긴축적 통화정책 (3.5% 초과):</b> 물가 안정을 위해 금리를 높은 수준으로 유지하고 있음을 의미합니다.'
        ],
        related_stocks: {
            '금리 인상기': '은행, 보험 등 금융주',
            '금리 인하기': '성장주, 기술주, 건설주'
        }
    },
    exchange_rate: {
        title: '🇰🇷 원/달러 환율',
        description: '1달러를 사는 데 필요한 원화의 양입니다. 환율이 오르면(원화 약세) 수출 기업의 가격 경쟁력은 높아지지만, 수입 물가가 올라 국내 물가 상승 압력으로 작용합니다. 반대로 환율이 내리면(원화 강세) 수입 물가 안정에는 도움이 되지만 수출 기업의 실적에는 부담이 될 수 있습니다.',
        criteria: [
            '💵 <b>환율 안정 (1300원 이하):</b> 수출입 기업 모두에게 안정적인 환경을 제공합니다.',
            ' fluctuating <b>환율 변동성 확대 (1300원 ~ 1350원):</b> 시장의 불확실성이 커지고 있음을 의미합니다.',
            '💸 <b>원화 약세 심화 (1350원 초과):</b> 수입 물가 상승으로 인한 인플레이션 압력이 커지고, 외국인 자금 유출 우려가 높아집니다.'
        ],
        seriesId: 'DEXKOUS',
        related_stocks: {
            '환율 상승 시 (원화 약세)': '자동차, 반도체 등 수출 기업 (예: 현대차, 삼성전자)',
            '환율 하락 시 (원화 강세)': '항공, 전력 등 수입 의존 기업 (예: 대한항공, 한국전력)'
        }
    },
    vix: {
        title: '😱 VIX 지수 (공포 지수)',
        description: '시장의 불안감을 나타내는 지표입니다. 주식 시장의 변동성이 앞으로 30일간 얼마나 클지를 예측하며, 지수가 높을수록 시장 참여자들이 느끼는 공포와 불안감이 크다는 의미입니다.',
        criteria: [
            '😌 <b>시장 안정 (20 이하):</b> 투자 심리가 안정적이며, 시장의 불확실성이 낮은 상태입니다.',
            '😟 <b>불안 심리 존재 (20 ~ 30):</b> 시장에 불안 요소가 있어 변동성이 커질 수 있는 상태입니다.',
            '😱 <b>공포 심리 확산 (30 초과):</b> 시장에 대한 공포가 극에 달해 주가가 급락할 가능성이 높은 위험한 상태입니다.'
        ],
        seriesId: 'VIXCLS',
        related_stocks: {
            'VIX 급등 시': '안전자산 (금, 달러), 경기방어주 (통신, 유틸리티)',
            'VIX 안정 시': '위험자산 (주식), 경기민감주'
        }
    },
    industrial_production: {
        title: '🇰🇷 산업생산지수',
        description: '국내 제조업, 광업 등 주요 산업의 생산 활동이 얼마나 활발한지를 보여줍니다. 이 지표가 상승하면 기업들의 생산이 활발하고 실물 경제가 튼튼하다는 신호로 해석됩니다.',
        criteria: [
            '🏭 <b>생산 활발 (1.0% 이상):</b> 제조업 경기가 확장 국면에 있음을 의미합니다.',
            '😐 <b>생산 보합 (0% ~ 1.0%):</b> 생산 활동이 정체되어 있음을 의미합니다.',
            '📉 <b>생산 위축 (0% 미만):</b> 생산 활동이 감소하고 있어 경기 둔화의 신호로 해석됩니다.'
        ],
        seriesId: 'KORPROINDMISMEI'
    },
    consumer_sentiment: {
        title: '🇰🇷 소비자심리지수 (CSI)',
        description: '소비자들이 현재 경제 상황을 어떻게 느끼고 미래를 어떻게 전망하는지를 나타냅니다. 이 지수가 100을 넘으면 미래 경기를 긍정적으로 보는 사람이 더 많다는 뜻으로, 향후 소비가 늘어날 가능성이 높음을 시사합니다.',
        criteria: [
            '😊 <b>소비 심리 낙관 (100 이상):</b> 소비자들이 경기를 긍정적으로 보고 있어 향후 소비가 늘어날 가능성이 높습니다.',
            '😐 <b>소비 심리 중립 (90 ~ 100):</b> 소비자들이 경기 상황을 관망하고 있습니다.',
            '😟 <b>소비 심리 비관 (90 미만):</b> 소비자들이 경기를 부정적으로 보고 있어 지갑을 닫을 가능성이 높습니다.'
        ],
        seriesId: 'CSENTKOR'
    },
    corp_bond_spread: {
        title: '🇰🇷 회사채 스프레드',
        description: '신용도가 낮은 회사채(BBB-)와 안전자산인 국고채 간의 금리 차이입니다. 이 스프레드가 커진다는 것은 기업들의 자금 조달이 어려워지고 부도 위험이 높아졌다고 시장이 판단하는 것을 의미합니다.',
        criteria: [
            '✅ <b>신용 위험 완화 (0.8%p 이하):</b> 기업들의 자금 조달 환경이 안정적입니다.',
            '⚠️ <b>신용 위험 보통 (0.8%p ~ 1.2%p):</b> 기업 신용 위험에 대한 경계감이 다소 있는 상태입니다.',
            '🚨 <b>신용 위험 증가 (1.2%p 초과):</b> 기업 부도 위험이 높아져 금융시장의 불안 요인이 될 수 있습니다.'
        ]
    },
    dollar_index: {
        title: '💲 달러 인덱스',
        description: '세계 주요 6개국 통화 대비 달러의 평균적인 가치를 보여줍니다. 달러 인덱스가 높으면 달러가 강세라는 뜻으로, 글로벌 자금이 안전자산인 달러로 몰려 신흥국 증시에는 부담이 될 수 있습니다.',
        criteria: [
            '💲 <b>달러 약세 (100 이하):</b> 달러 가치가 하락하여 신흥국 등 위험자산에 대한 투자 심리가 개선됩니다.',
            '💰 <b>달러 강세 (100 초과):</b> 달러 가치가 상승하여 안전자산 선호 심리가 강해집니다.'
        ],
        seriesId: 'DTWEXBGS'
    },
    wti_price: {
        title: '🛢️ WTI 유가',
        description: '서부 텍사스산 원유(WTI) 가격으로, 세계 경제의 혈액과도 같습니다. 유가는 전 세계 물가와 기업들의 생산 비용에 직접적인 영향을 미칩니다.',
        criteria: [
            '⛽ <b>유가 안정 (80달러 이하):</b> 물가 안정과 기업 생산 비용 절감에 긍정적입니다.',
            '🔺 <b>유가 상승 압력 (80달러 ~ 100달러):</b> 전 세계적으로 인플레이션 우려를 키우는 요인입니다.',
            '🔥 <b>고유가 부담 (100달러 초과):</b> 기업과 가계에 큰 부담을 주어 경기 둔화를 유발할 수 있습니다.'
        ],
        seriesId: 'MCOILWTICO',
        related_stocks: {
            '유가 상승 시': '정유, 화학, 종합상사 (예: S-Oil, SK이노베이션)',
            '유가 하락 시': '항공, 해운, 전력 (예: 대한항공, HMM)'
        }
    },
    kospi: {
        title: '🇰🇷 코스피 지수',
        description: '한국을 대표하는 주가 지수로, 국내 증권거래소에 상장된 기업들의 주가 움직임을 종합하여 표시합니다. 한국 경제의 전반적인 상황과 기업들의 실적을 반영하는 거울과도 같습니다.',
        criteria: [
            '📊 <b>주요 시장 지수:</b> 이 지수 자체는 분석 대상이기보다는 다른 지표들과 함께 종합적으로 해석하는 참고 자료입니다.'
        ]
    },
    producer_price_index: {
        title: '🇰🇷 생산자물가지수 (PPI)',
        description: '생산자가 시장에 공급하는 상품과 서비스의 가격 변동을 나타냅니다. 생산자물가는 보통 1~3개월의 시차를 두고 최종 소비자가 구매하는 소비자물가에 영향을 미치는 선행 지표 역할을 합니다.',
        criteria: [
            '😌 <b>생산자 물가 안정 (3.0% 이하):</b> 향후 소비자 물가 안정에 기여할 수 있는 긍정적인 신호입니다.',
            '🔺 <b>생산자 물가 부담 (3.0% 초과):</b> 기업들의 비용 부담이 커지고, 이는 결국 소비자 가격 인상으로 이어질 수 있습니다.'
        ]
    },
    sox_index: {
        title: '⚡️ 美 반도체 지수 (SOX)',
        description: '미국 증시에 상장된 대표적인 반도체 기업들의 주가를 추종하는 필라델피아 반도체 지수입니다. 전 세계 반도체 산업의 업황을 가장 잘 보여주는 핵심 선행 지표로 활용됩니다.',
        criteria: [
            '📈 <b>상승:</b> 반도체 수요가 견조하고 업황이 긍정적임을 의미합니다.',
            '📉 <b>하락:</b> 반도체 수요 둔화 및 업황 악화 우려를 반영합니다.'
        ],
        seriesId: 'SOX'
    },
    auto_sales: {
        title: '🚗 美 자동차 판매량',
        description: '미국 내에서 판매된 자동차 및 경트럭의 총량을 보여줍니다. 미국은 세계 최대의 자동차 시장 중 하나로, 이 데이터는 글로벌 자동차 수요와 소비 경기를 가늠하는 척도가 됩니다.',
        criteria: [
            '📈 <b>증가:</b> 소비 심리가 살아나고 자동차 수요가 강함을 의미합니다.',
            '📉 <b>감소:</b> 소비자들이 지갑을 닫고 있으며, 자동차 수요가 둔화되고 있음을 의미합니다.'
        ],
        seriesId: 'TOTALSA'
    },
    pharma_index: {
        title: '💊 美 제약업 생산자물가',
        description: '미국의 제약 및 의약품 제조업체의 생산자 물가 변동을 나타냅니다. 제약/바이오 산업은 전통적으로 경기가 좋지 않을 때도 꾸준한 수요가 발생하는 경기 방어적 성격을 가집니다.',
        criteria: [
            '📈 <b>물가 안정:</b> 생산 비용이 안정되어 기업 수익성에 긍정적입니다.',
            '📉 <b>물가 상승:</b> 생산 비용 증가로 기업 수익성에 부담이 될 수 있습니다.'
        ],
        seriesId: 'PCU325412325412'
    },
    retail_sales: {
        title: '🛒 美 소매 판매',
        description: '미국의 전반적인 소비 활동을 나타내는 핵심 지표입니다. 소매 판매가 증가하면 경제가 활발하게 움직이고 있음을 의미하며, 기업 실적에도 긍정적인 영향을 줍니다.',
        criteria: [
            '📈 <b>판매 호조:</b> 소비가 강하게 살아나고 있어 경기 확장의 신호입니다.',
            '📉 <b>판매 부진:</b> 소비 심리가 위축되고 있어 경기 둔화의 신호일 수 있습니다.'
        ],
        seriesId: 'MRTSSM44000USS'
    },
    home_price_index: {
        title: '🏠 美 주택 가격 지수',
        description: 'S&P/Case-Shiller 미국 전국 주택 가격 지수로, 미국 주택 시장의 건강 상태를 보여줍니다. 주택 가격 상승은 소비자의 자산 가치를 높여 소비 심리를 개선하는 효과가 있습니다.',
        criteria: [
            '📈 <b>가격 상승:</b> 주택 시장이 활성화되고 있으며, 이는 긍정적인 자산 효과로 이어질 수 있습니다.',
            '📉 <b>가격 하락:</b> 주택 시장이 둔화되고 있으며, 소비 심리에 부정적인 영향을 줄 수 있습니다.'
        ],
        seriesId: 'CSUSHPINSA'
    },
    nfp: {
        title: '🇺🇸 비농업 고용지수 (NFP)',
        description: '미국의 농업 부문을 제외한 고용 인구의 변동을 나타내는 지표로, 미국 경제의 건강 상태를 보여주는 가장 중요한 지표 중 하나입니다. 시장 예상치를 크게 상회하면 경기 호조, 하회하면 경기 둔화 신호로 해석됩니다.',
        criteria: [
            '👍 <b>고용 서프라이즈 (25만 이상):</b> 고용 시장이 매우 강력하여 경기 확장에 대한 기대를 높입니다.',
            '😐 <b>예상 부합 (15만 ~ 25만):</b> 고용 시장이 안정적으로 성장하고 있음을 의미합니다.',
            '👎 <b>고용 쇼크 (15만 미만):</b> 고용이 둔화되고 있어 경기 침체 우려를 키울 수 있습니다.'
        ],
        seriesId: 'PAYEMS'
    },
    us_cpi: {
        title: '🇺🇸 소비자물가지수 (CPI)',
        description: '미국 도시 소비자가 구매하는 상품 및 서비스 가격의 시간 경과에 따른 평균 변화를 측정합니다. 미국 연준(Fed)의 금리 정책 결정에 가장 중요한 영향을 미치는 지표입니다.',
        criteria: [
            '😌 <b>물가 안정 (2.5% 이하):</b> 물가가 연준의 목표치에 근접하여 금리 인하 기대를 높일 수 있습니다.',
            '😐 <b>인플레이션 둔화 (2.5% ~ 3.5%):</b> 물가 상승세가 꺾이고 있지만, 여전히 경계가 필요한 수준입니다.',
            '🔥 <b>물가 압력 지속 (3.5% 초과):</b> 높은 물가로 인해 연준이 긴축 정책을 유지하거나 강화할 가능성이 높습니다.'
        ],
        seriesId: 'CPIAUCSL'
    },
    philly_fed: {
        title: '🇺🇸 필라델피아 연은 제조업 지수',
        description: '필라델피아 연방준비은행 관할 지역의 제조업체들의 전반적인 기업 활동 수준을 평가하는 지표입니다. 0을 기준으로 확장과 위축을 판단하며, 미국 제조업 경기의 선행 지표로 활용됩니다.',
        criteria: [
            '📈 <b>확장 국면 (10 이상):</b> 제조업 경기가 강하게 확장되고 있음을 의미합니다.',
            '😐 <b>보합세 (-5 ~ 10):</b> 제조업 경기가 현상 유지 또는 소폭 개선되고 있음을 의미합니다.',
            '📉 <b>위축 국면 (-5 미만):</b> 제조업 경기가 위축되고 있어 경기 둔화의 신호로 해석됩니다.'
        ],
        seriesId: 'PHLMAN'
    }
};

// ==================================================================
// 초기 실행 함수
// ==================================================================
document.addEventListener('DOMContentLoaded', main);

async function main() {
    if (API_KEYS.FRED.includes('여기에') || API_KEYS.ECOS.includes('여기에')) {
        alert('script.js 파일 상단에 API 키를 먼저 입력해주세요.');
        return;
    }
    
    setupEventListeners();
    renderInitialPlaceholders();
    renderEconomicCalendar();

    try {
        const [macroData, sectorData] = await Promise.all([
            fetchAllMacroData(),
            fetchAllSectorData()
        ]);
        
        const allIndicators = [...macroData, ...sectorData].filter(i => i); // null 값 제거
        const analyzedIndicators = analyzeIndicators(allIndicators);
        
        const marketOutlook = getMarketOutlook(analyzedIndicators);
        
        renderDashboard(analyzedIndicators, marketOutlook);

    } catch (error) {
        console.error("전체 데이터 로딩 실패:", error);
        document.getElementById('update-time').innerText = "데이터 로딩에 실패했습니다. API 키 또는 네트워크 상태를 확인해주세요.";
    }
}

// ==================================================================
// 이벤트 리스너 설정
// ==================================================================
function setupEventListeners() {
    // Accordion
    const accordions = document.querySelectorAll(".accordion-header");
    accordions.forEach(accordion => {
        accordion.addEventListener("click", () => {
            const panel = accordion.nextElementSibling;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
            }
        });
    });

    // Modal
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };

    // Stock Search
    const searchBtn = document.getElementById('stock-search-btn');
    const searchInput = document.getElementById('stock-code-input');
    searchBtn.addEventListener('click', fetchAndRenderStockData);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            fetchAndRenderStockData();
        }
    });
}

// ==================================================================
// 개별 종목 데이터 처리
// ==================================================================
async function fetchAndRenderStockData() {
    const input = document.getElementById('stock-code-input');
    const stockCode = input.value.trim();
    if (stockCode.length !== 6 || !/^\d{6}$/.test(stockCode)) {
        alert('정확한 6자리 종목 코드를 입력해주세요.');
        return;
    }

    const section = document.getElementById('stock-details-section');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    
    try {
        const response = await fetch(`${STOCK_INFO_URL}${stockCode}`);
        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }
        const data = await response.json();
        renderStockDetails(data);

    } catch (error) {
        console.error('종목 정보 조회 실패:', error);
        alert('종목 정보를 불러오는 데 실패했습니다.');
    }
}

function renderStockDetails(data) {
    const { priceInfo, dailyChart, financialInfo } = data;

    // --- 기본 정보 렌더링 ---
    document.getElementById('stock-name').innerText = priceInfo.stck_kr_abrv || 'N/A';
    document.getElementById('stock-code').innerText = priceInfo.stck_shrn_iscd || 'N/A';
    
    const currentPrice = parseInt(priceInfo.stck_prpr.replace(/,/g, ''));
    const change = parseInt(priceInfo.prdy_vrss.replace(/,/g, ''));
    const changeRate = parseFloat(priceInfo.prdy_ctrt);

    document.getElementById('stock-price').innerText = `${currentPrice.toLocaleString()}원`;
    const changeEl = document.getElementById('stock-change');
    changeEl.innerText = `${change > 0 ? '▲' : '▼'} ${Math.abs(change).toLocaleString()}원 (${changeRate}%)`;
    changeEl.style.color = change > 0 ? '#dc3545' : '#0056b3';

    const marketCap = parseInt(priceInfo.hts_avls) / 100000000; // 조 단위로 변환
    document.getElementById('stock-market-cap').innerText = `${marketCap.toFixed(1)}조 원`;
    document.getElementById('stock-per-pbr').innerText = `${priceInfo.per} / ${priceInfo.pbr}`;
    
    const dividendYield = (parseInt(priceInfo.dps.replace(/,/g, '')) / currentPrice * 100).toFixed(2);
    document.getElementById('stock-dividend-yield').innerText = `${dividendYield}%`;

    // --- 차트 렌더링 ---
    renderStockPriceChart(dailyChart);
    renderStockFinanceChart(financialInfo); // 샘플 데이터에만 존재
}

function renderStockPriceChart(chartData) {
    const ctx = document.getElementById('stock-price-chart').getContext('2d');
    if (stockPriceChart) {
        stockPriceChart.destroy();
    }
    
    const labels = chartData.map(d => `${d.stck_bsop_date.substring(4,6)}-${d.stck_bsop_date.substring(6,8)}`);
    const data = chartData.map(d => parseInt(d.stck_clpr));

    stockPriceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '종가',
                data: data,
                borderColor: '#0056b3',
                backgroundColor: 'rgba(0, 86, 179, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderStockFinanceChart(financialData) {
    if (!financialData) return; // API 응답에 재무정보가 없을 수 있음
    
    const ctx = document.getElementById('stock-finance-chart').getContext('2d');
    if (stockFinanceChart) {
        stockFinanceChart.destroy();
    }

    const labels = financialData.annual.map(d => d.year);
    const revenues = financialData.annual.map(d => parseFloat(d.revenue.replace('조', '')));
    const profits = financialData.annual.map(d => parseFloat(d.profit.replace('조', '')));

    stockFinanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '매출액(조)',
                    data: revenues,
                    backgroundColor: '#17a2b8',
                },
                {
                    label: '영업이익(조)',
                    data: profits,
                    backgroundColor: '#6c757d',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// ==================================================================
// 데이터 Fetch 함수들
// ==================================================================

// FRED API 호출을 위한 헬퍼 함수
async function fetchFredData(seriesId, limit = 1) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${API_KEYS.FRED}&file_type=json&sort_order=desc&limit=${limit}`;
    try {
        const res = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!data.observations || data.observations.length === 0) return null;
        return data.observations;
    } catch (error) {
        console.error(`FRED 데이터 로딩 실패 (${seriesId}):`, error);
        return null;
    }
}

async function fetchAllMacroData() {
    const [yieldData, additionalFredData, koreanIndicators] = await Promise.all([
        fetchYieldSpread(),
        fetchAdditionalFredData(),
        fetchAllKoreanData()
    ]);
    return [yieldData, ...additionalFredData, ...koreanIndicators];
}

async function fetchYieldSpread() {
    const [obs10Y, obs2Y] = await Promise.all([
        fetchFredData('DGS10'),
        fetchFredData('DGS2')
    ]);
    if (!obs10Y || !obs2Y) return null;
    const spread = parseFloat(obs10Y[0].value) - parseFloat(obs2Y[0].value);
    return { id: "yield_spread", name: "🇺🇸 장단기 금리차", value: parseFloat(spread.toFixed(2)), unit: "%p", date: obs10Y[0].date.substring(5) };
}

async function fetchAdditionalFredData() {
    const series = { 
        vix: 'VIXCLS', 
        dollar_index: 'DTWEXBGS', // 수정된 키
        wti_price: 'MCOILWTICO', // 수정된 키
        nfp: 'PAYEMS',
        us_cpi: 'CPIAUCSL',
        philly_fed: 'PHLMAN'
    };

    const promises = Object.entries(series).map(async ([key, seriesId]) => {
        const obs = await fetchFredData(seriesId);
        if (!obs) return null;
        
        let value = parseFloat(obs[0].value);
        let unit = '';
        
        if (key === 'nfp') {
            value = parseFloat((value / 1000).toFixed(1)); // 천명 -> 만명 단위 변경
            unit = '만명';
        } else if (key === 'wti_price') {
            unit = '$/bbl';
        } else if (key === 'us_cpi') {
            unit = '%';
        }
        
        const details = indicatorDetails[key];
        if (!details) {
            console.error(`indicatorDetails에서 '${key}'를 찾을 수 없습니다.`);
            return null;
        }

        return { id: key, name: details.title, value, unit, date: obs[0].date.substring(5) };
    });

    return Promise.all(promises);
}

async function fetchAllKoreanData() {
    const ecosApiUrl = `https://ecos.bok.or.kr/api/KeyStatisticList/${API_KEYS.ECOS}/json/kr/1/100`;
    try {
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(ecosApiUrl)}`);
        const data = await response.json();
        if (!data.KeyStatisticList || !data.KeyStatisticList.row) throw new Error("한국은행 데이터 구조 오류");
        
        const allStats = data.KeyStatisticList.row;
        const mapping = {
            base_rate: { name: '🇰🇷 기준금리', keywords: ['기준금리'] },
            exchange_rate: { name: '🇰🇷 원/달러 환율', keywords: ['원/달러'] },
            industrial_production: { name: '🇰🇷 산업생산지수', keywords: ['산업생산지수'] },
            consumer_sentiment: { name: '🇰🇷 소비자심리지수', keywords: ['소비자동향조사', '소비자심리지수'] },
            corp_bond_spread: { name: '🇰🇷 회사채 스프레드', keywords: ['회사채', '스프레드'] },
            kospi: { name: '🇰🇷 코스피', keywords: ['KOSPI'] },
            producer_price_index: { name: '🇰🇷 생산자물가지수', keywords: ['생산자물가지수'] },
            gdp_growth: { name: '🇰🇷 GDP 성장률', keywords: ['GDP', '성장률', '전기대비'] },
            export_growth: { name: '🇰🇷 수출 증가율', keywords: ['수출', '증감률'] },
            cpi: { name: '🇰🇷 소비자물가지수', keywords: ['소비자물가지수'] },
            unemployment: { name: '🇰🇷 실업률', keywords: ['실업률'] }
        };
        
        const found = {};
        allStats.forEach(stat => {
            for (const [key, value] of Object.entries(mapping)) {
                if (!found[key] && value.keywords.every(kw => stat.KEYSTAT_NAME.includes(kw))) {
                    found[key] = {
                        id: key, name: value.name, value: parseFloat(stat.DATA_VALUE),
                        unit: stat.UNIT_NAME, date: stat.TIME ? (stat.TIME.substring(4, 6) + '월') : '최신'
                    };
                }
            }
        });
        return Object.values(found);
    } catch (error) {
        console.error("한국은행 데이터 로딩 실패:", error);
        return [];
    }
}

async function fetchAllSectorData() {
    const series = {
        sox_index: 'SOX',
        pharma_index: 'PCU325412325412',
        auto_sales: 'TOTALSA',
        retail_sales: 'MRTSSM44000USS',
        home_price_index: 'CSUSHPINSA'
    };

    const promises = Object.entries(series).map(async ([key, seriesId]) => {
        const obs = await fetchFredData(seriesId);
        if (!obs) return null;
        
        let value = parseFloat(obs[0].value);
        let unit = '';
        if (key === 'auto_sales') unit = 'M';
        if (key === 'retail_sales') unit = '$';

        return { id: key, name: indicatorDetails[key].title, value, unit, date: obs[0].date.substring(5) };
    });

    return Promise.all(promises);
}

async function fetchHistoricalData(indicatorId) {
    const detail = indicatorDetails[indicatorId];
    if (!detail || !detail.seriesId) return null;

    const seriesId = detail.seriesId;
    const limit = 12;

    if (indicatorId === 'yield_spread') {
        const [data10Y, data2Y] = await Promise.all([
            fetchFredData(seriesId[0], limit),
            fetchFredData(seriesId[1], limit)
        ]);
        if (!data10Y || !data2Y) return null;
        
        const dataMap = new Map();
        data10Y.forEach(obs => dataMap.set(obs.date, { val10: obs.value }));
        data2Y.forEach(obs => {
            if (dataMap.has(obs.date)) {
                dataMap.get(obs.date).val2 = obs.value;
            }
        });

        const combinedData = [];
        dataMap.forEach((values, date) => {
            if(values.val10 && values.val2) {
                combinedData.push({
                    date,
                    value: (parseFloat(values.val10) - parseFloat(values.val2)).toFixed(2)
                });
            }
        });
        
        return combinedData.sort((a,b) => new Date(a.date) - new Date(b.date));

    } else {
        const data = await fetchFredData(seriesId, limit);
        if (!data) return null;
        return data.map(obs => ({ date: obs.date, value: obs.value })).reverse();
    }
}

// ==================================================================
// 데이터 분석 및 가공 함수
// ==================================================================
function analyzeIndicators(indicators) {
    const weights = {
        yield_spread: 15, vix: 15, gdp_growth: 10, export_growth: 10, industrial_production: 8,
        corp_bond_spread: 8, cpi: 7, dollar_index: 6, wti_price: 5, consumer_sentiment: 5,
        base_rate: 4, unemployment: 4, exchange_rate: 3, producer_price_index: 2, kospi: 0,
        sox_index: 0, auto_sales: 0, pharma_index: 0, retail_sales: 0, home_price_index: 0,
        nfp: 12, us_cpi: 10, philly_fed: 6
    };

    return indicators.map(indicator => {
        let analysis = { weight: weights[indicator.id] || 0 };
        if (typeof indicator.value !== 'number' || isNaN(indicator.value)) {
             return { ...indicator, ...analysis, status: 'neutral', score: 0, text: '데이터 없음', icon: '❓' };
        }
        switch (indicator.id) {
            case 'yield_spread':
                if (indicator.value < -0.1) analysis = { ...analysis, status: 'negative', score: -2, text: '경기 침체 우려', icon: '🚨' };
                else if (indicator.value < 0) analysis = { ...analysis, status: 'neutral', score: 0, text: '역전폭 축소', icon: '⚠️' };
                else analysis = { ...analysis, status: 'positive', score: 2, text: '정상 범위', icon: '✅' };
                break;
            case 'vix':
                if (indicator.value <= 20) analysis = { ...analysis, status: 'positive', score: 2, text: '시장 안정', icon: '😌' };
                else if (indicator.value <= 30) analysis = { ...analysis, status: 'neutral', score: 0, text: '불안 심리 존재', icon: '😟' };
                else analysis = { ...analysis, status: 'negative', score: -2, text: '공포 심리 확산', icon: '😱' };
                break;
            case 'gdp_growth':
                if (indicator.value >= 0.7) analysis = { ...analysis, status: 'positive', score: 2, text: '견조한 회복세', icon: '👍' };
                else if (indicator.value >= 0.3) analysis = { ...analysis, status: 'neutral', score: 0, text: '완만한 성장', icon: '😐' };
                else analysis = { ...analysis, status: 'negative', score: -2, text: '성장 둔화 우려', icon: '👎' };
                break;
            case 'export_growth':
                if (indicator.value > 2.0) analysis = { ...analysis, status: 'positive', score: 2, text: '플러스 전환', icon: '📈' };
                else if (indicator.value >= 0) analysis = { ...analysis, status: 'neutral', score: 0, text: '소폭 개선', icon: '📊' };
                else analysis = { ...analysis, status: 'negative', score: -2, text: '수출 부진', icon: '📉' };
                break;
            case 'industrial_production':
                if (indicator.value > 1.0) analysis = { ...analysis, status: 'positive', score: 2, text: '생산 활발', icon: '🏭' };
                else if (indicator.value >= 0) analysis = { ...analysis, status: 'neutral', score: 0, text: '생산 보합', icon: '😐' };
                else analysis = { ...analysis, status: 'negative', score: -2, text: '생산 위축', icon: '📉' };
                break;
            case 'cpi':
            case 'us_cpi':
                if (indicator.value <= 3.0) analysis = { ...analysis, status: 'positive', score: 1, text: '물가 안정세', icon: '😌' };
                else if (indicator.value <= 4.0) analysis = { ...analysis, status: 'neutral', score: 0, text: '인플레이션 둔화', icon: '😐' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '물가 압력 지속', icon: '🔥' };
                break;
            case 'unemployment':
                if (indicator.value <= 3.0) analysis = { ...analysis, status: 'positive', score: 1, text: '완전고용 수준', icon: '💪' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '고용 시장 악화', icon: '😥' };
                break;
             case 'base_rate':
                if (indicator.value <= 2.5) analysis = { ...analysis, status: 'positive', score: 1, text: '완화적 통화정책', icon: '💰' };
                else if (indicator.value <= 3.5) analysis = { ...analysis, status: 'neutral', score: 0, text: '중립적 금리 수준', icon: '⚖️' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '긴축적 통화정책', icon: '🔒' };
                break;
            case 'exchange_rate':
                if (indicator.value <= 1300) analysis = { ...analysis, status: 'positive', score: 1, text: '환율 안정', icon: '💵' };
                else if (indicator.value <= 1350) analysis = { ...analysis, status: 'neutral', score: 0, text: '환율 변동성 확대', icon: ' fluctuating' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '원화 약세 심화', icon: '💸' };
                break;
            case 'consumer_sentiment':
                if (indicator.value >= 100) analysis = { ...analysis, status: 'positive', score: 1, text: '소비 심리 낙관', icon: '😊' };
                else if (indicator.value >= 90) analysis = { ...analysis, status: 'neutral', score: 0, text: '소비 심리 중립', icon: '😐' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '소비 심리 비관', icon: '😟' };
                break;
            case 'corp_bond_spread':
                if (indicator.value <= 0.8) analysis = { ...analysis, status: 'positive', score: 1, text: '신용 위험 완화', icon: '✅' };
                else if (indicator.value <= 1.2) analysis = { ...analysis, status: 'neutral', score: 0, text: '신용 위험 보통', icon: '⚠️' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '신용 위험 증가', icon: '🚨' };
                break;
            case 'dollar_index':
                if (indicator.value <= 100) analysis = { ...analysis, status: 'positive', score: 1, text: '달러 약세', icon: '💲' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '달러 강세', icon: '💰' };
                break;
            case 'wti_price':
                if (indicator.value <= 80) analysis = { ...analysis, status: 'positive', score: 1, text: '유가 안정', icon: '⛽' };
                else if (indicator.value <= 100) analysis = { ...analysis, status: 'neutral', score: 0, text: '유가 상승 압력', icon: '🔺' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '고유가 부담', icon: '🔥' };
                break;
            case 'producer_price_index':
                if (indicator.value <= 3.0) analysis = { ...analysis, status: 'positive', score: 1, text: '생산자 물가 안정', icon: '😌' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '생산자 물가 부담', icon: '🔺' };
                break;
            case 'nfp':
                if (indicator.value >= 25) analysis = { ...analysis, status: 'positive', score: 2, text: '고용 서프라이즈', icon: '👍' };
                else if (indicator.value >= 15) analysis = { ...analysis, status: 'neutral', score: 0, text: '예상 부합', icon: '😐' };
                else analysis = { ...analysis, status: 'negative', score: -2, text: '고용 쇼크', icon: '👎' };
                break;
            case 'philly_fed':
                if (indicator.value >= 10) analysis = { ...analysis, status: 'positive', score: 1, text: '확장 국면', icon: '📈' };
                else if (indicator.value >= -5) analysis = { ...analysis, status: 'neutral', score: 0, text: '보합세', icon: '😐' };
                else analysis = { ...analysis, status: 'negative', score: -1, text: '위축 국면', icon: '📉' };
                break;
            case 'kospi':
            case 'sox_index':
            case 'auto_sales':
            case 'pharma_index':
            case 'retail_sales':
            case 'home_price_index':
                analysis = { ...analysis, status: 'neutral', score: 0, text: '참고 지표', icon: '📊' };
                break;
            default: analysis = { ...analysis, status: 'neutral', score: 0, text: '분석 중', icon: '📊' };
        }
        return { ...indicator, ...analysis };
    });
}

function getMarketOutlook(analyzedIndicators) {
    let totalWeightedScore = 0;
    let totalPossibleScore = 0;

    analyzedIndicators.forEach(indicator => {
        if (typeof indicator.score === 'number' && indicator.weight > 0) {
            totalWeightedScore += indicator.score * indicator.weight;
            const maxScore = Math.abs(indicator.score) > 1 ? 2 : 1;
            totalPossibleScore += maxScore * indicator.weight;
        }
    });
    
    const normalizedScore = totalPossibleScore > 0 ? 50 + 50 * (totalWeightedScore / totalPossibleScore) : 50;

    if (normalizedScore > 65) return { status: 'positive', signal: '📈', title: `상승 기대 (점수: ${normalizedScore.toFixed(1)})`, analysis: "다수의 핵심 경제 지표가 긍정적인 신호를 보내고 있습니다. 경기 확장, 물가 안정, 위험자산 선호 심리가 복합적으로 나타나며 투자 환경이 우호적일 가능성이 높습니다." };
    if (normalizedScore < 35) return { status: 'negative', signal: '📉', title: `하락 우려 (점수: ${normalizedScore.toFixed(1)})`, analysis: "경기 침체 또는 둔화에 대한 우려가 커지고 있습니다. 장단기 금리차, VIX 지수 등 주요 선행지표가 부정적인 신호를 보내고 있어 보수적인 접근이 필요합니다." };
    return { status: 'neutral', signal: '😐', title: `중립 / 혼조 (점수: ${normalizedScore.toFixed(1)})`, analysis: "긍정적 요인과 부정적 요인이 혼재되어 시장의 방향성이 불분명합니다. 향후 발표될 기업 실적이나 주요 정책 변화에 따라 시장의 방향이 결정될 가능성이 높습니다." };
}

// ==================================================================
// 동적 렌더링 함수들
// ==================================================================

function renderInitialPlaceholders() {
    const grid = document.getElementById('indicator-grid');
    grid.innerHTML = Object.values(indicatorDetails).map(detail => 
        `<div class="indicator-card"><p class="loading-text">${detail.title}<br>Loading...</p></div>`
    ).join('');
    
    const placeholders = {
        'sector-outlook-grid': '<div class="sector-card"><p class="loading-text">섹터 정보 분석 중...</p></div>',
        'investment-suggestions-grid': '<div class="sector-card"><p class="loading-text">투자 정보 분석 중...</p></div>',
    };
    for(const [id, html] of Object.entries(placeholders)) {
        document.getElementById(id).innerHTML = html;
    }
}

function renderDashboard(analyzedIndicators, marketOutlook) {
    document.getElementById('update-time').innerText = `마지막 업데이트: ${new Date().toLocaleString('ko-KR')}`;
    
    const outlookSection = document.getElementById('outlook-section');
    outlookSection.className = `${marketOutlook.status}-bg`;
    outlookSection.innerHTML = `
        <div class="outlook-signal">${marketOutlook.signal}</div>
        <h3 class="outlook-title ${marketOutlook.status}-text">${marketOutlook.title}</h3>
        <p class="outlook-analysis">${marketOutlook.analysis}</p>
    `;

    renderSectorOutlook(analyzedIndicators);
    renderInvestmentSuggestions(analyzedIndicators);

    const indicatorGrid = document.getElementById('indicator-grid');
    indicatorGrid.innerHTML = '';
    
    const totalWeight = analyzedIndicators.reduce((sum, ind) => sum + (ind.weight > 0 ? ind.weight : 0), 0);
    analyzedIndicators.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    
    analyzedIndicators.forEach(indicator => {
        if (!indicator.id) return;
        const impactRatio = totalWeight > 0 && indicator.weight > 0 ? ((indicator.weight / totalWeight) * 100).toFixed(1) : 0;
        
        const card = document.createElement('div');
        card.className = 'indicator-card';
        if (indicator.status === 'negative') card.classList.add('card-negative-bg');

        const valueText = (typeof indicator.value === 'number') 
            ? `${indicator.value.toLocaleString()}${indicator.unit || ''}` 
            : `<span class="loading-text">N/A</span>`;
            
        card.innerHTML = `
            <div>
                <div class="indicator-card-header">
                    <h4>${indicator.name}<br><span class="date">(${indicator.date})</span></h4>
                </div>
                <p class="indicator-value">${valueText}</p>
                <div class="indicator-status">
                    <span class="status-icon">${indicator.icon}</span>
                    <span class="status-text ${indicator.status}-icon">${indicator.text}</span>
                </div>
            </div>
            <div class="card-footer">
                ${impactRatio > 0 ? `<span class="impact-ratio">영향력 ${impactRatio}%</span>` : ''}
                <button class="details-btn">자세히 보기</button>
            </div>`;
        card.querySelector('.details-btn').addEventListener('click', () => showModal(indicator.id));
        indicatorGrid.appendChild(card);
    });
}

function renderSectorOutlook(analyzedIndicators) {
    const find = (id) => analyzedIndicators.find(i => i.id === id) || { score: 0, value: 'N/A' };
    const grid = document.getElementById('sector-outlook-grid');

    const sox = find('sox_index');
    const exchange = find('exchange_rate');
    let electronicsReason = `美 반도체 지수(${sox.value})와 원/달러 환율(${exchange.value}원)이 핵심 변수입니다. `;
    let electronicsStatus = 'neutral';
    if(exchange.score > 0) {
        electronicsStatus = 'positive';
        electronicsReason += '우호적인 환율 환경이 수출 기업의 수익성을 높여줍니다.';
    } else {
        electronicsReason += '환율이 안정적이거나 강세일 경우, 수익성에 부담이 될 수 있습니다.';
    }

    const auto = find('auto_sales');
    const wti = find('wti_price');
    let autoReason = `美 자동차 판매량(${auto.value}M)은 양호하나, WTI 유가(${wti.value}$)가 소비 심리에 영향을 줍니다. `;
    let autoStatus = 'neutral';
    if(auto.value > 16 && wti.score > 0) {
        autoStatus = 'positive';
        autoReason += '견조한 판매량과 유가 안정이 긍정적입니다.';
    } else if (auto.value < 14) {
        autoStatus = 'negative';
        autoReason += '판매량 둔화가 우려됩니다.'
    }
    
    const vix = find('vix');
    let pharmaReason = `대표적인 경기 방어주로, VIX 지수(${vix.value})가 높을 때 주목받습니다. `;
    let pharmaStatus = 'neutral';
    if(vix.score < 0) {
        pharmaStatus = 'positive';
        pharmaReason += '시장 변동성 확대 시, 안정적인 피난처가 될 수 있습니다.'
    } else {
        pharmaReason += '시장 안정기에는 성장주 대비 매력도가 낮아질 수 있습니다.'
    }

    const retail = find('retail_sales');
    const sentiment = find('consumer_sentiment');
    let retailStatus = 'neutral';
    let retailReason = `美 소매판매(${retail.value}$)와 국내 소비심리(${sentiment.value})를 함께 고려해야 합니다.`;
    if(retail.value > 680000 && sentiment.score > 0) {
        retailStatus = 'positive';
        retailReason += '견조한 소비는 내수 경기 회복의 긍정적 신호입니다.'
    }

    const home = find('home_price_index');
    const rate = find('base_rate');
    let constructionStatus = 'neutral';
    let constructionReason = `美 주택가격(${home.value})과 국내 기준금리(${rate.value}%)가 건설 경기에 영향을 줍니다.`;
    if(rate.score > 0) {
        constructionStatus = 'positive';
        constructionReason += '금리 인하 기대감은 부동산 시장에 긍정적입니다.'
    }

    const sectors = [
        { icon: '⚡️', name: '전기/전자', status: electronicsStatus, reason: electronicsReason, stocks: '삼성전자, SK하이닉스' },
        { icon: '🚗', name: '자동차', status: autoStatus, reason: autoReason, stocks: '현대차, 기아' },
        { icon: '💊', name: '의약/바이오', status: pharmaStatus, reason: pharmaReason, stocks: '삼성바이오로직스, 셀트리온' },
        { icon: '🛒', name: '유통/소비재', status: retailStatus, reason: retailReason, stocks: '이마트, CJ제일제당' },
        { icon: '🏠', name: '건설/부동산', status: constructionStatus, reason: constructionReason, stocks: '현대건설, GS건설' },
    ];

    grid.innerHTML = sectors.map(sector => `
        <div class="sector-card">
            <div>
                <h4 class="sector-title"><span class="sector-icon">${sector.icon}</span>${sector.name}</h4>
                <p class="sector-outlook ${sector.status}-text">${{positive: '긍정적', negative: '부정적', neutral: '중립적'}[sector.status]}</p>
                <p class="sector-reason">${sector.reason}</p>
            </div>
            <div class="related-stocks-container">
                <p class="related-stocks-title">핵심 종목:</p>
                <p class="related-stocks-list">${sector.stocks}</p>
            </div>
        </div>
    `).join('');
}

function renderInvestmentSuggestions(analyzedIndicators) {
    const find = (id) => analyzedIndicators.find(i => i.id === id) || { score: 0, text: 'N/A' };
    const grid = document.getElementById('investment-suggestions-grid');

    const vix = find('vix');
    const yieldSpread = find('yield_spread');
    const exportGrowth = find('export_growth');
    const dollarIndex = find('dollar_index');
    
    const stockReason = `<b>긍정 요인:</b> ${vix.text}, ${exportGrowth.text}<br><b>부정 요인:</b> ${yieldSpread.text}`;
    const bondReason = `<b>분석:</b> ${yieldSpread.text}. 국내 물가와 환율 부담으로 기준금리 인하가 쉽지 않은 상황입니다.`;
    const goldReason = `<b>분석:</b> ${dollarIndex.text}. 달러 강세는 부담 요인이지만, 지정학적 리스크 등이 가격을 지지하고 있습니다.`;
    const btcReason = `<b>분석:</b> ${vix.text}. 위험 선호 심리가 일부 회복된 점은 긍정적이나, 높은 변동성은 여전한 위험 요소입니다.`;

    grid.innerHTML = `
        <div class="sector-card">
            <h4 class="sector-title"><span class="sector-icon">📈</span>주식</h4>
            <p class="sector-outlook neutral-text">중립적 (섹터별 차별화)</p>
            <p class="sector-reason">${stockReason}</p>
        </div>
        <div class="sector-card">
            <h4 class="sector-title"><span class="sector-icon">⚖️</span>채권</h4>
            <p class="sector-outlook neutral-text">신중한 접근</p>
            <p class="sector-reason">${bondReason}</p>
        </div>
        <div class="sector-card">
            <h4 class="sector-title"><span class="sector-icon">🥇</span>금</h4>
            <p class="sector-outlook positive-text">긍정적 (분산 투자)</p>
            <p class="sector-reason">${goldReason}</p>
        </div>
        <div class="sector-card">
            <h4 class="sector-title"><span class="sector-icon">₿</span>비트코인</h4>
            <p class="sector-outlook neutral-text">높은 변동성 주의</p>
            <p class="sector-reason">${btcReason}</p>
        </div>
    `;
}

function renderEconomicCalendar() {
    const events = [
        { date: '2025-10-02', title: '🇰🇷 한국 소비자물가지수 (CPI)', importance: '높음', description: '한국은행의 기준금리 결정에 핵심적인 영향을 미치는 물가 지표입니다.' },
        { date: '2025-10-03', title: '🇺🇸 미국 비농업 고용지수 (NFP)', importance: '매우 높음', description: '미국 고용 시장 상태를 나타내는 핵심 지표로, 연준의 통화정책 방향에 큰 영향을 줍니다.' },
        { date: '2025-10-10', title: '🇰🇷 한국 소비자심리지수 (PCSI)', importance: '보통', description: '소비자들의 경기 인식을 보여주어 내수 경기를 예측하는 데 참고됩니다.' },
        { date: '2025-10-15', title: '🇺🇸 미국 소비자물가지수 (CPI)', importance: '매우 높음', description: '미국의 인플레이션 압력을 측정하며, 전 세계 금융 시장의 방향을 결정할 수 있습니다.' },
        { date: '2025-10-16', title: '🇺🇸 미국 필라델피아 연은 제조업 지수', importance: '보통', description: '미국 제조업 경기의 건전성을 파악할 수 있는 선행 지표 중 하나입니다.' },
        { date: '2025-11-07', title: '🇺🇸 미국 비농업 고용지수 (NFP)', importance: '매우 높음', description: '연말을 앞두고 미국 고용 시장의 추세를 확인할 수 있는 중요한 발표입니다.' },
        { date: '2025-11-13', title: '🇺🇸 미국 소비자물가지수 (CPI)', importance: '매우 높음', description: '다음 해의 통화 정책에 대한 시장의 기대를 형성하는 데 결정적인 역할을 합니다.' }
    ];

    const calendarGrid = document.getElementById('economic-calendar-grid');
    calendarGrid.innerHTML = ''; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events
        .map(event => ({ ...event, dateObj: new Date(event.date) }))
        .filter(event => event.dateObj >= today)
        .sort((a, b) => a.dateObj - b.dateObj);

    if (upcomingEvents.length === 0) {
        calendarGrid.innerHTML = '<p>향후 예정된 주요 경제 일정이 없습니다.</p>';
        return;
    }

    calendarGrid.innerHTML = upcomingEvents.map(event => {
        const formattedDate = `${event.dateObj.getFullYear()}년 ${event.dateObj.getMonth() + 1}월 ${event.dateObj.getDate()}일`;
        return `
            <div class="calendar-card">
                <div class="calendar-date">${formattedDate}</div>
                <div class="calendar-event">
                    <div class="calendar-event-title">${event.title}</div>
                    <div class="calendar-event-importance">중요도: ${event.importance}</div>
                    <div class="calendar-event-description">${event.description}</div>
                </div>
            </div>`;
    }).join('');
}


// ==================================================================
// 모달 및 차트 관련 함수
// ==================================================================
function getNormalRange(indicatorId) {
    const details = indicatorDetails[indicatorId];
    if (!details || !details.criteria) return null;

    const positiveMarkers = ['✅', '👍', '📈', '💪', '😌', '😊', '💰', '💵', '💲', '⛽', '🏭', '정상', '안정', '완화', '낙관'];
    const normalCriterion = details.criteria.find(c => positiveMarkers.some(marker => c.includes(marker)));
    
    if (!normalCriterion) return null;

    const rangeText = normalCriterion.match(/\(([^)]+)\)/);
    if (!rangeText || !rangeText[1]) return null;

    const text = rangeText[1];
    let min = -Infinity, max = Infinity;

    let match = text.match(/(-?\d+\.?\d*)\s*(?:이상|초과)/);
    if (match) {
        min = parseFloat(match[1]);
        return { min, max };
    }

    match = text.match(/(-?\d+\.?\d*)\s*(?:이하|미만)/);
    if (match) {
        max = parseFloat(match[1]);
        return { min, max };
    }

    match = text.match(/(-?\d+\.?\d*)\s*~\s*(-?\d+\.?\d*)/);
    if (match) {
        min = parseFloat(match[1]);
        max = parseFloat(match[2]);
        return { min, max };
    }

    return null;
}

const rangeAnnotationPlugin = {
    id: 'rangeAnnotation',
    beforeDatasetsDraw: (chart, args, options) => {
        const { range } = options;
        if (!range) return;
        
        const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
        
        const getPixel = (value, fallback) => {
            if (value === -Infinity || value === Infinity) {
                return fallback;
            }
            return y.getPixelForValue(value);
        };

        const yMinPixel = getPixel(range.min, bottom);
        const yMaxPixel = getPixel(range.max, top);

        ctx.save();
        ctx.fillStyle = 'rgba(40, 167, 69, 0.15)';
        
        const rectY = Math.min(yMinPixel, yMaxPixel);
        const rectHeight = Math.abs(yMaxPixel - yMinPixel);
        
        const finalY = Math.max(rectY, top);
        const finalHeight = Math.min(rectHeight, bottom - finalY);

        ctx.fillRect(left, finalY, right - left, finalHeight);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        let textY = (finalY + finalY + finalHeight) / 2;
        if (textY < top + 10) textY = top + 10;
        if (textY > bottom - 10) textY = bottom - 10;
        
        ctx.fillText('정상 범위', left + 5, textY);

        ctx.restore();
    }
};


async function showModal(indicatorId) {
    const details = indicatorDetails[indicatorId];
    if (!details) return;

    document.getElementById('modal-title').innerHTML = details.title;
    document.getElementById('modal-description').innerHTML = details.description;
    document.getElementById('modal-criteria').innerHTML = details.criteria.map(item => `<li>${item}</li>`).join('');
    
    const relatedStocksContainer = document.getElementById('modal-related-stocks');
    if (details.related_stocks) {
        let stocksHtml = '';
        for (const [condition, stocks] of Object.entries(details.related_stocks)) {
            stocksHtml += `
                <div class="related-stocks-item">
                    <p class="related-stocks-title">${condition}:</p>
                    <p class="related-stocks-list">${stocks}</p>
                </div>
            `;
        }
        relatedStocksContainer.innerHTML = `<h4>관련 종목:</h4>${stocksHtml}`;
        relatedStocksContainer.style.display = 'block';
    } else {
        relatedStocksContainer.style.display = 'none';
    }

    const modal = document.getElementById('modal');
    const chartContainer = modal.querySelector('.chart-container');
    
    if (indicatorChart) {
        indicatorChart.destroy();
    }
    
    chartContainer.innerHTML = '<p class="loading-text">과거 데이터 로딩 중...</p>';
    modal.style.display = 'block';

    const historicalData = await fetchHistoricalData(indicatorId);

    if (historicalData && historicalData.length > 0) {
        chartContainer.innerHTML = '<canvas id="indicator-chart"></canvas>';
        const ctx = document.getElementById('indicator-chart').getContext('2d');
        
        const normalRange = getNormalRange(indicatorId);
        
        const dataValues = historicalData.map(d => parseFloat(d.value));
        const dataMax = Math.max(...dataValues);
        const dataMin = Math.min(...dataValues);

        let yAxisTop = dataMax;

        if (normalRange) {
            if (normalRange.max !== Infinity) {
                yAxisTop = Math.max(yAxisTop, normalRange.max);
            }
            if (normalRange.min !== -Infinity) {
                yAxisTop = Math.max(yAxisTop, normalRange.min);
            }
        }
        
        let finalMax;
        const rangeSpan = yAxisTop - dataMin;
        if (rangeSpan > 0) {
            finalMax = yAxisTop + rangeSpan * 0.2;
        } else {
            finalMax = yAxisTop > 0 ? yAxisTop * 1.2 : yAxisTop + 1; 
        }

        indicatorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historicalData.map(d => d.date.substring(5)),
                datasets: [{
                    label: details.title.split('(')[0].trim(),
                    data: dataValues,
                    borderColor: '#0056b3',
                    backgroundColor: 'rgba(0, 86, 179, 0.1)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    rangeAnnotation: {
                        range: normalRange
                    }
                },
                scales: {
                    x: { title: { display: true, text: '날짜' } },
                    y: { 
                        title: { display: true, text: '값' },
                        max: finalMax
                    }
                }
            },
            plugins: [rangeAnnotationPlugin]
        });
    } else {
        chartContainer.innerHTML = '<p>이 지표의 과거 데이터는 제공되지 않거나 로드에 실패했습니다.</p>';
    }
}
