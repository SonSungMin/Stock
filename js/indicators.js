// js/indicators.js

// ==================================================================
// 지표 발표일 정보
// ==================================================================
export const releaseSchedules = {
    us_cpi: { dates: ["01-15", "02-12", "03-12", "04-10", "05-13", "06-11", "07-15", "08-12", "09-11", "10-24", "11-13", "12-10"] },
    nfp: { dates: ["01-10", "02-07", "03-07", "04-04", "05-02", "06-06", "07-03", "08-01", "09-05", "10-03", "11-07", "12-05"] },
    philly_fed: { dates: ["01-16", "02-20", "03-20", "04-17", "05-15", "06-19", "07-17", "08-21", "09-18", "10-16", "11-20", "12-18"] }
};

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
    base_rate: { periodicity: 'monthly', offset: 0 },
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
    exchange_rate: { title: '🇰🇷 원/달러 환율', seriesId: 'DEXKOUS', description: '1달러를 사는 데 필요한 원화의 양입니다...', criteria: [ '💵 <b>환율 안정 (1300원 이하)</b>', '〰️ <b>변동성 확대 (1300원 ~ 1350원)</b>', '💸 <b>원화 약세 심화 (1350원 초과)</b>' ] },
    vix: { title: '😱 VIX 지수 (공포 지수)', seriesId: 'VIXCLS', description: '시장의 불안감을 나타내는 지표입니다...', criteria: [ '😌 <b>시장 안정 (20 이하)</b>', '😟 <b>불안 심리 (20 ~ 30)</b>', '😱 <b>공포 심리 (30 초과)</b>' ] },
    dollar_index: { title: '💲 달러 인덱스', seriesId: 'DTWEXBGS', description: '주요 6개국 통화 대비 달러의 가치입니다...', criteria: [ '💲 <b>달러 약세 (100 이하)</b>', '💰 <b>달러 강세 (100 초과)</b>' ] },
    wti_price: { title: '🛢️ WTI 유가', seriesId: 'MCOILWTICO', description: '서부 텍사스산 원유(WTI) 가격입니다...', criteria: [ '⛽ <b>유가 안정 (80달러 이하)</b>', '🔺 <b>상승 압력 (80달러 ~ 100달러)</b>', '🔥 <b>고유가 부담 (100달러 초과)</b>' ] },
    sox_index: { title: '⚡️ 美 반도체 지수 (SOX)', seriesId: 'SOX', description: '필라델피아 반도체 지수입니다...', criteria: [ '📈 <b>상승:</b> 업황 긍정', '📉 <b>하락:</b> 업황 악화' ] },
    auto_sales: { title: '🚗 美 자동차 판매량', seriesId: 'TOTALSA', description: '미국 내 자동차 판매량입니다...', criteria: [ '📈 <b>증가:</b> 소비 심리 개선', '📉 <b>감소:</b> 소비 심리 위축' ] },
    retail_sales: { title: '🛒 美 소매 판매', seriesId: 'MRTSSM44000USS', description: '미국의 전반적인 소비 활동 지표입니다...', criteria: [ '📈 <b>판매 호조:</b> 경기 확장 신호', '📉 <b>판매 부진:</b> 경기 둔화 신호' ] },
    home_price_index: { title: '🏠 美 주택 가격 지수', seriesId: 'CSUSHPINSA', description: 'S&P/Case-Shiller 주택 가격 지수입니다...', criteria: [ '📈 <b>가격 상승:</b> 시장 활성화', '📉 <b>가격 하락:</b> 시장 둔화' ] },
    nfp: { title: '🇺🇸 비농업 고용지수 (NFP)', seriesId: 'PAYEMS', description: '미국의 고용 인구 변동 지표입니다...', criteria: [ '👍 <b>고용 서프라이즈 (25만 이상)</b>', '😐 <b>예상 부합 (15만 ~ 25만)</b>', '👎 <b>고용 쇼크 (15만 미만)</b>' ] },
    us_cpi: { title: '🇺🇸 소비자물가지수 (CPI)', seriesId: 'CPIAUCSL', description: '미국 소비자 물가 변동 지표입니다...', criteria: [ '😌 <b>물가 안정 (2.5% 이하)</b>', '😐 <b>인플레이션 둔화 (2.5% ~ 3.5%)</b>', '🔥 <b>물가 압력 지속 (3.5% 초과)</b>' ] },
    philly_fed: { title: '🇺🇸 필라델피아 연은 제조업 지수', seriesId: 'PHLMAN', description: '미국 제조업 경기의 선행 지표입니다...', criteria: [ '📈 <b>확장 국면 (10 이상)</b>', '😐 <b>보합세 (-5 ~ 10)</b>', '📉 <b>위축 국면 (-5 미만)</b>' ] },
    
    // === ECOS (한국) 지표 ===
    gdp_growth: { title: '🇰🇷 GDP 성장률', description: '한국의 경제 규모 성장률입니다...', criteria: [ '👍 <b>견조한 회복세 (0.7% 이상)</b>', '😐 <b>완만한 성장 (0.3% ~ 0.7%)</b>', '👎 <b>성장 둔화 우려 (0.3% 미만)</b>' ] },
    export_growth: { title: '🇰🇷 수출 증가율', description: '수출 실적의 증감률입니다...', criteria: [ '📈 <b>플러스 전환 (2.0% 이상)</b>', '📊 <b>소폭 개선 (0% ~ 2.0%)</b>', '📉 <b>수출 부진 (0% 미만)</b>' ] },
    cpi: { title: '🇰🇷 소비자물가지수 (CPI)', description: '한국 소비자 물가 변동 지표입니다...', criteria: [ '😌 <b>물가 안정세 (3.0% 이하)</b>', '😐 <b>인플레이션 둔화 (3.0% ~ 4.0%)</b>', '🔥 <b>물가 압력 지속 (4.0% 초과)</b>' ] },
    unemployment: { title: '🇰🇷 실업률', description: '경제활동인구 중 실업자 비율입니다...', criteria: [ '💪 <b>완전고용 수준 (3.0% 이하)</b>', '😥 <b>고용 시장 악화 (3.0% 초과)</b>' ] },
    base_rate: { title: '🇰🇷 기준금리', description: '한국은행의 정책 금리입니다...', criteria: [ '💰 <b>완화적 통화정책 (2.5% 이하)</b>', '⚖️ <b>중립적 금리 수준 (2.5% ~ 3.5%)</b>', '🔒 <b>긴축적 통화정책 (3.5% 초과)</b>' ] },
    kor_bond_3y: { title: '🇰🇷 국채 3년 금리', description: '단기 시장 금리의 벤치마크입니다. 금리가 하락하면 채권 가격은 상승하며, 이는 일반적으로 주식 시장에 긍정적입니다.', criteria: [ '✅ <b>금리 안정 (3.5% 이하)</b>', '⚠️ <b>금리 상승 압력 (3.5% ~ 4.0%)</b>', '🚨 <b>고금리 부담 (4.0% 초과)</b>' ] },
    m2_growth: { title: '🇰🇷 M2(광의통화) 증가율', description: '시중 유동성의 양을 보여주는 지표입니다. 높은 증가율은 자산 시장에 유동성 공급이 원활함을 의미하지만, 과도할 경우 인플레이션을 유발할 수 있습니다.', criteria: [ '💧 <b>유동성 적정 (5% ~ 7%)</b>', '〰️ <b>유동성 과잉/부족 우려 (7% 초과 또는 5% 미만)</b>' ] },
    industrial_production: { title: '🇰🇷 산업생산지수', description: '주요 산업의 생산 활동 지수입니다...', criteria: [ '🏭 <b>생산 활발 (1.0% 이상)</b>', '😐 <b>생산 보합 (0% ~ 1.0%)</b>', '📉 <b>생산 위축 (0% 미만)</b>' ] },
    consumer_sentiment: { title: '🇰🇷 소비자심리지수 (CSI)', description: '소비자들의 경제 상황 인식 지표입니다...', criteria: [ '😊 <b>소비 심리 낙관 (100 이상)</b>', '😐 <b>소비 심리 중립 (90 ~ 100)</b>', '😟 <b>소비 심리 비관 (90 미만)</b>' ] },
    corp_bond_spread: { title: '🇰🇷 회사채 스프레드', description: '회사채와 국고채 간의 금리 차이입니다...', criteria: [ '✅ <b>신용 위험 완화 (0.8%p 이하)</b>', '⚠️ <b>신용 위험 보통 (0.8%p ~ 1.2%)</b>', '🚨 <b>신용 위험 증가 (1.2%p 초과)</b>' ] },
    kospi: { title: '🇰🇷 코스피 지수', description: '한국을 대표하는 주가 지수입니다...', criteria: ['📊 <b>주요 시장 지수</b>'] },
    producer_price_index: { title: '🇰🇷 생산자물가지수 (PPI)', description: '생산자 공급 가격 변동 지표입니다...', criteria: [ '😌 <b>생산자 물가 안정 (3.0% 이하)</b>', '🔺 <b>생산자 물가 부담 (3.0% 초과)</b>' ] }
};
