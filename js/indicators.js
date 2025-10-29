// js/indicators.js

// ==================================================================
// 지표 발표일 정보
// ==================================================================
export const releaseSchedules = {
    us_cpi: { dates: ["01-15", "02-12", "03-12", "04-10", "05-13", "06-11", "07-15", "08-12", "09-11", "10-24", "11-13", "12-10"] },
    nfp: { dates: ["01-10", "02-07", "03-07", "04-04", "05-02", "06-06", "07-03", "08-01", "09-05", "10-03", "11-07", "12-05"] },
    philly_fed: { dates: ["01-16", "02-20", "03-20", "04-17", "05-15", "06-19", "07-17", "08-21", "09-18", "10-16", "11-20", "12-18"] },
    ism_pmi: { dates: ["~01-03", "~02-01", "~03-01", "~04-01", "~05-01", "~06-03", "~07-01", "~08-01", "~09-03", "~10-01", "~11-01", "~12-02"] }
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
    producer_price_index: { periodicity: 'monthly', offset: 1 },
    ism_pmi: { periodicity: 'monthly', offset: 1 },
    copper_price: { periodicity: 'monthly', offset: 1 },
    kor_consumer_sentiment: { periodicity: 'monthly', offset: 0 }
};

// ==================================================================
// 지표 상세 정보 (설명, 판단 기준, FRED/ECOS ID)
// ==================================================================
export const indicatorDetails = {
    // === FRED (미국/글로벌) 지표 ===
    yield_spread: { title: '🇺🇸 장단기 금리차 (10Y-2Y)', seriesId: 'T10Y2Y', description: '미래 경기를 예측하는 핵심 선행 지표입니다. 10년 만기 국채 수익률에서 2년 만기 국채 수익률을 뺀 값입니다. 역전(마이너스) 시 경기 침체를 예고하는 강력한 신호로 알려져 있습니다.', criteria: [ '✅ <b>정상 범위 (0.1%p 이상)</b>: 경제가 정상적으로 작동 중이며, 장기 성장에 대한 신뢰가 있습니다.', '⚠️ <b>주의 구간 (-0.2%p ~ 0.1%p)</b>: 금리 역전 임박 또는 초기 단계로, 경기 둔화 우려가 제기됩니다.', '🚨 <b>침체 신호 (-0.2%p 미만)</b>: 강한 역전 상태로, 향후 12~18개월 내 경기 침체 가능성이 높습니다.' ] },
    exchange_rate: { title: '🇰🇷 원/달러 환율', seriesId: 'DEXKOUS', description: '1달러를 사는 데 필요한 원화의 양입니다. 환율이 높아지면(원화 약세) 수출 기업에는 긍정적이지만, 수입 물가 상승 압력이 커집니다.', criteria: [ '💵 <b>원화 강세 (1300원 이하)</b>: 외환 시장 안정, 수입 물가 안정화', '〰️ <b>변동성 확대 (1300원 ~ 1380원)</b>: 대외 불확실성 증가', '💸 <b>원화 약세 (1380원 초과)</b>: 수입 물가 부담 증가, 외환 시장 불안' ] },
    vix: { title: '😱 VIX 지수 (공포 지수)', seriesId: 'VIXCLS', description: '시장의 불안감을 나타내는 지표입니다. S&P 500 옵션의 내재 변동성을 측정하며, 투자자들의 공포 심리를 반영합니다.', criteria: [ '😌 <b>시장 안정 (20 이하)</b>: 낮은 변동성, 투자 심리 양호', '😟 <b>불안 심리 (20 ~ 30)</b>: 변동성 확대, 경계 필요', '😱 <b>공포 심리 (30 초과)</b>: 시장 패닉 상태, 급격한 조정 위험' ] },
    dollar_index: { title: '💲 달러 인덱스', seriesId: 'DTWEXBGS', description: '주요 6개국 통화 대비 달러의 가치입니다. 달러 강세는 미국 수출에 불리하지만, 신흥국 자산에는 압력 요인입니다.', criteria: [ '💲 <b>달러 약세 (100 이하)</b>: 위험자산 선호, 신흥국 자산 매력도 증가', '💰 <b>달러 강세 (100 초과)</b>: 안전자산 선호, 신흥국 자금 유출 압력' ] },
    wti_price: { title: '🛢️ WTI 유가', seriesId: 'MCOILWTICO', description: '서부 텍사스산 원유(WTI) 가격입니다. 글로벌 경기와 지정학적 리스크를 반영하며, 인플레이션의 주요 변수입니다.', criteria: [ '⛽ <b>유가 안정 (80달러 이하)</b>: 에너지 비용 부담 완화', '🔺 <b>상승 압력 (80달러 ~ 100달러)</b>: 인플레이션 우려 증가', '🔥 <b>고유가 부담 (100달러 초과)</b>: 기업 원가 상승, 소비자 부담 증가' ] },
    sox_index: { title: '⚡️ 美 반도체 지수 (SOX)', seriesId: 'NASDAQSOX', description: '필라델피아 반도체 지수입니다. 기술주 및 글로벌 IT 산업의 선행 지표로 활용됩니다.', criteria: [ '📈 <b>상승 추세 (4000 이상)</b>: 반도체 수요 강세, 기술주 랠리 기대', '📉 <b>하락/조정 (4000 미만)</b>: 재고 조정 또는 수요 둔화 우려' ] },
    auto_sales: { title: '🚗 美 자동차 판매량', seriesId: 'TOTALSA', description: '미국 내 자동차 판매량입니다. 소비자 신뢰도와 경기 사이클을 반영하는 중요한 지표입니다.', criteria: [ '📈 <b>판매 호조 (증가)</b>: 소비 심리 양호, 경기 확장', '📉 <b>판매 부진 (감소)</b>: 소비 위축, 경기 둔화 신호' ] },
    retail_sales: { title: '🛒 美 소매 판매', seriesId: 'MRTSSM44000USS', description: '미국의 전반적인 소비 활동 지표입니다. GDP의 약 70%를 차지하는 소비를 직접 측정합니다.', criteria: [ '📈 <b>판매 호조 (증가)</b>: 경기 확장 국면', '📉 <b>판매 부진 (감소)</b>: 소비 위축, 경기 둔화' ] },
    home_price_index: { title: '🏠 美 주택 가격 지수', seriesId: 'CSUSHPINSA', description: 'S&P/Case-Shiller 주택 가격 지수입니다. 부동산 시장의 건강도와 자산 효과를 나타냅니다.', criteria: [ '📈 <b>가격 상승</b>: 자산 효과 증대, 소비 여력 증가', '📉 <b>가격 하락</b>: 자산 디플레이션 우려' ] },
    nfp: { title: '🇺🇸 비농업 고용지수 (NFP)', seriesId: 'PAYEMS', description: '미국의 고용 인구 변동 지표입니다. 연준(Fed)의 통화정책 결정에 가장 중요한 지표 중 하나입니다.', criteria: [ '👍 <b>고용 서프라이즈 (25만 이상)</b>: 강한 고용 시장, 경기 확장', '😐 <b>예상 부합 (15만 ~ 25만)</b>: 안정적인 고용 증가', '👎 <b>고용 쇼크 (15만 미만)</b>: 고용 시장 약화, 경기 둔화 우려' ] },
    us_cpi: { title: '🇺🇸 소비자물가지수 (CPI)', seriesId: 'CPIAUCSL', description: '미국 소비자 물가 변동 지표입니다. 연준의 인플레이션 목표(2%)와 비교하여 통화정책 방향성을 예측하는 데 핵심적입니다.', criteria: [ '😌 <b>물가 안정 (2.5% 이하 YoY)</b>: 목표 수준 근접, 금리 인하 여력', '😐 <b>인플레 둔화 (2.5% ~ 3.5% YoY)</b>: 물가 압력 완화 중', '🔥 <b>물가 압력 지속 (3.5% 초과 YoY)</b>: 고금리 장기화 우려' ] },
    philly_fed: { title: '🏭 필라델피아 연은 제조업 지수', seriesId: 'PHLMAN', description: '미국 제조업 경기의 선행 지표입니다. 0을 기준으로 확장/위축을 판단합니다.', criteria: [ '📈 <b>확장 국면 (10 이상)</b>: 제조업 활황', '😐 <b>보합세 (-5 ~ 10)</b>: 제조업 중립', '📉 <b>위축 국면 (-5 미만)</b>: 제조업 침체' ] },
    
    // S&P 500 예측 관련 지표들
    ism_pmi: { title: '🏭 ISM 제조업 PMI', seriesId: 'NAPM', description: '미국 공급관리협회(ISM)에서 발표하는 제조업 구매관리자지수입니다. 50을 기준으로 경기 확장/위축을 판단하는 가장 신뢰도 높은 선행 지표 중 하나입니다.', criteria: [ '🚀 <b>강한 확장 (55 이상)</b>: 제조업 강세, 경기 호황', '📈 <b>확장 국면 (50 ~ 55)</b>: 제조업 성장 중', '⚠️ <b>둔화/위축 우려 (45 ~ 50)</b>: 제조업 위축 전환 가능', '🚨 <b>경기 위축 (45 미만)</b>: 제조업 침체, 경기 하강' ] },
    consumer_sentiment: { title: '😊 미시간대 소비자심리지수', seriesId: 'UMCSENT', description: '미시간대학교에서 발표하는 소비자들의 경제 전망 및 소비 태도를 나타내는 지표입니다. 향후 소비 활동을 예측하는 선행 지표로 활용됩니다.', criteria: [ '😊 <b>소비 심리 낙관 (80 이상)</b>: 소비 활동 증가 기대', '😐 <b>소비 심리 중립 (70 ~ 80)</b>: 소비 안정세', '😟 <b>소비 심리 비관 (70 미만)</b>: 소비 위축 우려' ] },
    copper_price: { title: '🔶 닥터 코퍼 (구리 가격)', seriesId: 'PCOPPUSDM', description: '구리는 산업 전반에 사용되어 "경제학 박사(Dr. Copper)"라 불립니다. 실물 경제의 건강 상태를 진단하는 데 매우 유용한 선행 지표입니다.', criteria: [ '📈 <b>강한 상승 (YoY > 5%)</b>: 산업 수요 강세, 경기 확장', '📈 <b>상승 추세 (0% < YoY ≤ 5%)</b>: 수요 회복 중', '횡보 <b>보합/소폭 하락 (-5% < YoY ≤ 0%)</b>: 수요 정체', '📉 <b>하락 추세 (YoY ≤ -5%)</b>: 수요 급감, 경기 둔화' ] }, 

    // === ECOS (한국) 지표 ===
    gdp_growth: { title: '🇰🇷 GDP 성장률', description: '한국의 경제 규모 성장률입니다. 분기별(QoQ) 성장률로 경기 사이클을 파악합니다.', criteria: [ '👍 <b>견조한 회복세 (0.7% 이상 QoQ)</b>: 강한 경제 성장', '😐 <b>완만한 성장 (0.3% ~ 0.7% QoQ)</b>: 안정적 성장', '👎 <b>성장 둔화 우려 (0.3% 미만 QoQ)</b>: 경기 둔화 신호' ] },
    export_growth: { title: '🇰🇷 수출 증가율', description: '수출 실적의 증감률입니다. 한국 경제는 수출 의존도가 높아 GDP에 직접적인 영향을 미칩니다.', criteria: [ '📈 <b>수출 호조 (2.0% 이상 YoY)</b>: 대외 수요 강세', '📊 <b>소폭 개선 (0% ~ 2.0% YoY)</b>: 수출 회복 중', '📉 <b>수출 부진 (0% 미만 YoY)</b>: 대외 수요 약화' ] },
    cpi: { title: '🇰🇷 소비자물가지수 (CPI)', description: '한국 소비자 물가 변동 지표입니다. 한국은행의 물가 목표(2%)를 기준으로 통화정책이 결정됩니다.', criteria: [ '😌 <b>물가 안정세 (3.0% 이하 YoY)</b>: 목표에 근접', '😐 <b>인플레이션 둔화 (3.0% ~ 4.0% YoY)</b>: 물가 압력 완화 중', '🔥 <b>물가 압력 지속 (4.0% 초과 YoY)</b>: 고금리 유지 압력' ] },
    unemployment: { title: '🇰🇷 실업률', description: '경제활동인구 중 실업자 비율입니다. 한국의 완전고용 수준은 약 3% 내외로 평가됩니다.', criteria: [ '💪 <b>완전고용 수준 (3.0% 이하)</b>: 고용 시장 안정', '😥 <b>고용 시장 악화 (3.0% 초과)</b>: 일자리 감소 우려' ] },
    base_rate: { title: '🇰🇷 기준금리', description: '한국은행의 정책 금리입니다. 경기와 물가를 조절하는 가장 강력한 통화정책 수단입니다.', criteria: [ '💰 <b>완화적 통화정책 (2.5% 이하)</b>: 경기 부양 목적', '⚖️ <b>중립적 금리 수준 (2.5% ~ 3.5%)</b>: 경기와 물가 균형', '🔒 <b>긴축적 통화정책 (3.5% 초과)</b>: 물가 억제 목적' ] },
    kor_bond_3y: { title: '🇰🇷 국채 3년 금리', description: '단기 시장 금리의 벤치마크입니다. 향후 기준금리 변화를 선반영하는 경향이 있습니다.', criteria: [ '✅ <b>금리 안정 (3.5% 이하)</b>: 금리 인하 기대감 또는 안정', '⚠️ <b>금리 상승 압력 (3.5% ~ 4.0%)</b>: 긴축 지속 우려', '🚨 <b>고금리 부담 (4.0% 초과)</b>: 차입 비용 급증' ] },
    m2_growth: { title: '🇰🇷 M2(광의통화) 증가율', description: '시중 유동성의 양을 보여주는 지표입니다. 적정 수준(5~7%)을 벗어나면 자산 버블 또는 신용 경색을 유발할 수 있습니다.', criteria: [ '💧 <b>유동성 적정 (5% ~ 7% YoY)</b>: 경제 성장에 적합한 통화량', '〰️ <b>유동성 과잉/부족 우려 (범위 이탈)</b>: 버블 또는 경색 위험' ] },
    industrial_production: { title: '🇰🇷 산업생산지수', description: '주요 산업의 생산 활동 지수입니다. 제조업 중심 경제인 한국의 경기 상황을 실시간으로 보여줍니다.', criteria: [ '🏭 <b>생산 활발 (1.0% 이상 MoM)</b>: 산업 활동 강세', '😐 <b>생산 보합 (0% ~ 1.0% MoM)</b>: 안정적 생산', '📉 <b>생산 위축 (0% 미만 MoM)</b>: 산업 활동 둔화' ] },
    corp_bond_spread: { title: '🇰🇷 회사채 스프레드', description: '회사채와 국고채 간의 금리 차이입니다. 신용 위험과 시장 불안을 측정하는 지표입니다.', criteria: [ '✅ <b>신용 위험 완화 (0.8%p 이하)</b>: 기업 신용도 양호', '⚠️ <b>신용 위험 보통 (0.8%p ~ 1.2%p)</b>: 일반적인 수준', '🚨 <b>신용 위험 증가 (1.2%p 초과)</b>: 신용 경색 우려' ] },
    kospi: { title: '🇰🇷 코스피 지수', description: '한국을 대표하는 주가 지수입니다. 국내외 경제 상황과 투자 심리를 종합적으로 반영합니다.', criteria: ['📊 <b>주요 시장 지수</b>: 한국 증시의 벤치마크'] },
    producer_price_index: { title: '🇰🇷 생산자물가지수 (PPI)', description: '생산자 공급 가격 변동 지표입니다. 향후 소비자 물가에 선행하는 경향이 있습니다.', criteria: [ '😌 <b>생산자 물가 안정 (3.0% 이하 YoY)</b>: 원자재 비용 안정', '🔺 <b>생산자 물가 부담 (3.0% 초과 YoY)</b>: 생산 비용 증가' ] },
    kor_consumer_sentiment: { title: '🇰🇷 소비자심리지수 (CSI)', description: '소비자들의 경제 상황 인식 지표입니다. 100을 기준으로 낙관/비관을 판단합니다.', criteria: [ '😊 <b>소비 심리 낙관 (100 이상)</b>: 소비 증가 기대', '😐 <b>소비 심리 중립 (90 ~ 100)</b>: 보합세', '😟 <b>소비 심리 비관 (90 미만)</b>: 소비 위축' ] }
};
