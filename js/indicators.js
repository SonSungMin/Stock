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
    yield_spread: { title: '🇺🇸 장단기 금리차', seriesId: ['DGS10', 'DGS2'], description: '미래 경기를 예측하는 핵심 선행 지표입니다...', criteria: [ '✅ <b>정상 범위 (0 이상)</b>', '⚠️ <b>역전폭 축소 (-0.1 ~ 0)</b>', '🚨 <b>경기 침체 우려 (-0.1 미만)</b>' ] },
    exchange_rate: { title: '🇰🇷 원/달러 환율', seriesId: 'DEXKOUS', description: '1달러를 사는 데 필요한 원화의 양입니다...', criteria: [ '💵 <b>환율 안정 (1300원 이하)</b>', ' fluctuating <b>변동성 확대 (1300원 ~ 1350원)</b>', '💸 <b>원화 약세 심화 (1350원 초과)</b>' ] },
    vix: { title: '😱 VIX 지수 (공포 지수)', seriesId: 'VIXCLS', description: '시장의 불안감을 나타내는 지표입니다...', criteria: [ '😌 <b>시장 안정 (20 이하)</b>', '😟 <b>불안 심리 (20 ~ 30)</b>', '😱 <b>공포 심리 (30 초과)</b>' ] },
    dollar_index: { title: '💲 달러 인덱스', seriesId: 'DTWEXBGS', description: '주요 6개국 통화 대비 달러의 가치입니다...', criteria: [ '💲 <b>달러 약세 (100 이하)</b>', '💰 <b>달러 강세 (100 초과)</b>' ] },
    wti_price: { title: '🛢️ WTI 유가', seriesId: 'MCOILWTICO', description: '서부 텍사스산 원유(WTI) 가격입니다...', criteria: [ '⛽ <b>유가 안정 (80달러 이하)</b>', '🔺 <b>상승 압력 (80달러 ~ 100달러)</b>', '🔥 <b>고유가 부담 (100달러 초과)</b>' ] },
    sox_index: { title: '⚡️ 美 반도체 지수 (SOX)', seriesId: 'SOX', description: '필라델피아 반도체 지수입니다...', criteria: [ '📈 <b>상승:</b> 업황 긍정', '📉 <b>하락:</b> 업황 악화' ] },
    auto_sales: { title: '🚗 美 자동차 판매량', seriesId: 'TOTALSA', description: '미국 내 자동차 판매량입니다...', criteria: [ '📈 <b>증가:</b> 소비 심리 개선', '📉 <b>감소:</b> 소비 심리
