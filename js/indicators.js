// js/indicators.js

// ==================================================================
// 지표 발표일 정보
// ==================================================================
// 1. 특정일 발표 (미국)
export const releaseSchedules = {
    us_cpi: { dates: ["01-15", "02-12", "03-12", "04-10", "05-13", "06-11", "07-15", "08-12", "09-11", "10-24", "11-13", "12-10"] },
    nfp: { dates: ["01-10", "02-07", "03-07", "04-04", "05-02", "06-06", "07-03", "08-01", "09-05", "10-03", "11-07", "12-05"] },
    philly_fed: { dates: ["01-16", "02-20", "03-20", "04-17", "05-15", "06-19", "07-17", "08-21", "09-18", "10-16", "11-20", "12-18"] }
};

// 2. 주기적 발표 (월/분기 단위)
export const releaseCycles = {
    yield_spread: { periodicity: 'daily' },
    exchange_rate: { periodicity: 'daily' },
    vix: { periodicity: 'daily' },
    dollar_index: { periodicity: 'daily' },
    wti_price: { periodicity: 'monthly', offset: 1 },
    sox_index: { periodicity: 'daily' },
    auto_sales: { periodicity: 'monthly', offset: 1 },
    retail_sales: { periodicity: 'monthly', offset: 1 },
    home_price_index: { periodicity: 'monthly', offset: 2 },
    gdp_growth: { periodicity: 'quarterly', offset: 1 },
    export_growth: { periodicity: 'monthly', offset: 1 },
    cpi: { periodicity: 'monthly', offset: 1 },
    unemployment: { periodicity: 'monthly', offset: 1 },
    base_rate: { periodicity: 'monthly', offset: 0 }, // 보통 당월 발표
    industrial_production: { periodicity: 'monthly', offset: 1 },
    consumer_sentiment: { periodicity: 'monthly', offset: 0 },
    corp_bond_spread: { periodicity: 'daily' },
    kospi: { periodicity: 'daily' },
    producer_price_index: { periodicity: 'monthly', offset: 1 }
};

// ==================================================================
// 지표 상세 정보 (설명, 판단 기준, FRED/ECOS ID)
// ==================================================================
export const indicatorDetails = {
    // === FRED (미국/글로벌) 지표 ===
    yield_spread: { title: '🇺🇸 장단기 금리차', seriesId: ['DGS10', 'DGS2'], description: '미래 경기를 예측하는 핵심 선행 지표입니다. 10년물 국채 금리에서 2년물 국채 금리를 뺀 값으로, 양수(+)이면 정상적인 수익률 곡선, 음수(-)이면 역전된 수익률 곡선을 의미합니다. 수익률 곡선 역전은 일반적으로 12~24개월 후 경기 침체의 전조로 해석됩니다.', criteria: [ '✅ <b>정상 범위 (0 이상):</b> 향후 경기 확장에 대한 기대감 반영', '⚠️ <b>역전폭 축소 (-0.1 ~ 0):</b> 경기 둔화 우려와 침체 가능성이 혼재', '🚨 <b>경기 침체 우려 (-0.1 미만):</b> 단기 금리가 장기 금리보다 높아 향후 경기 침체 가능성 높음' ] },
    exchange_rate: { title: '🇰🇷 원/달러 환율', seriesId: 'DEXKOUS', description: '1달러를 사는 데 필요한 원화의 양입니다. 환율 상승은 원화 가치 하락을, 하락은 원화 가치 상승을 의미합니다. 일반적으로 환율 상승은 수출 기업에 유리하고 수입 물가를 높이는 요인이 됩니다.', criteria: [ '💵 <b>환율 안정 (1300원 이하):</b> 외국인 자
