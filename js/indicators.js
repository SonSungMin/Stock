// js/indicators.js

// ==================================================================
// 지표 발표일 정보
// ==================================================================
export const releaseSchedules = {
    us_cpi: { dates: ["01-15", "02-12", "03-12", "04-10", "05-13", "06-11", "07-15", "08-12", "09-11", "10-24", "11-13", "12-10"] },
    nfp: { dates: ["01-10", "02-07", "03-07", "04-04", "05-02", "06-06", "07-03", "08-01", "09-05", "10-03", "11-07", "12-05"] },
    philly_fed: { dates: ["01-16", "02-20", "03-20", "04-17", "05-15", "06-19", "07-17", "08-21", "09-18", "10-16", "11-20", "12-18"] },
    // 💡 [추가] ISM PMI 발표일 (대략 매월 첫 영업일) - 정확한 날짜 지정 어려움
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
    // 💡 [추가] 신규 지표 주기
    ism_pmi: { periodicity: 'monthly', offset: 1 },
    copper_price: { periodicity: 'daily' } // FRED 구리 선물 가격은 일별
};

// ==================================================================
// 지표 상세 정보 (설명, 판단 기준, FRED/ECOS ID)
// ==================================================================
export const indicatorDetails = {
    // === FRED (미국/글로벌) 지표 ===
    yield_spread: { title: '🇺🇸 장단기 금리차', seriesId: ['DGS10', 'DGS2'], description: '미래 경기를 예측하는 핵심 선행 지표입니다. 10년물 국채 금리에서 2년물 국채 금리를 뺀 값으로, 일반적으로 양수(+)를 유지합니다. 금리차가 0에 가까워지거나 음수(-)로 역전되면 경기 침체 가능성이 높아지는 것으로 해석됩니다.', criteria: [ '✅ <b>정상 범위 (0.1%p 이상)</b>: 경기 확장 기대', '⚠️ <b>주의 구간 (-0.2%p ~ 0.1%p)</b>: 경기 둔화 또는 침체 우려', '🚨 <b>침체 신호 (-0.2%p 미만)</b>: 높은 확률로 경기 침체 발생' ] },
    exchange_rate: { title: '🇰🇷 원/달러 환율', seriesId: 'DEXKOUS', description: '1달러를 사는 데 필요한 원화의 양입니다. 환율 상승은 원화 가치 하락(약세)을 의미하며, 수출 기업에는 유리할 수 있으나 수입 물가 상승 및 외국인 자금 유출 압력으로 작용할 수 있습니다.', criteria: [ '💵 <b>원화 강세 (1300원 이하)</b>: 안정적 흐름, 외국인 자금 유입 기대', '〰️ <b>변동성 확대 (1300원 ~ 1380원)</b>: 시장 불확실성 반영', '💸 <b>원화 약세 (1380원 초과)</b>: 수입 물가 부담, 자금 유출 우려' ] },
    vix: { title: '😱 VIX 지수 (공포 지수)', seriesId: 'VIXCLS', description: 'S&P 500 지수 옵션 가격 변동성을 바탕으로 향후 30일간 시장의 기대 변동성을 나타냅니다. 지수가 높을수록 시장 참여자들이 느끼는 불안감이 크다는 의미입니다.', criteria: [ '😌 <b>시장 안정 (20 이하)</b>', '😟 <b>불안 심리 (20 ~ 30)</b>', '😱 <b>공포 심리 (30 초과)</b>' ] },
    dollar_index: { title: '💲 달러 인덱스', seriesId: 'DTWEXBGS', description: '주요 6개국 통화(유로, 엔, 파운드, 캐나다 달러, 스웨덴 크로나, 스위스 프랑) 대비 미국 달러의 가치를 나타내는 지표입니다. 달러 강세는 일반적으로 위험 회피 심리 강화 또는 미국 경제의 상대적 강세를 의미합니다.', criteria: [ '💲 <b>달러 약세 (100 이하)</b>: 위험 선호 심리, 신흥국 통화 강세', '💰 <b>달러 강세 (100 초과)</b>: 위험 회피 심리, 미국 경제 상대적 강세' ] },
    wti_price: { title: '🛢️ WTI 유가', seriesId: 'MCOILWTICO', description: '서부 텍사스산 원유(WTI) 선물 가격입니다. 유가는 물가, 기업 생산 비용, 소비 심리 등 경제 전반에 영향을 미치는 중요한 변수입니다.', criteria: [ '⛽ <b>유가 안정 (80달러 이하)</b>', '🔺 <b>상승 압력 (80달러 ~ 100달러)</b>', '🔥 <b>고유가 부담 (100달러 초과)</b>' ] },
    sox_index: { title: '⚡️ 美 반도체 지수 (SOX)', seriesId: 'SOX', description: '필라델피아 반도체 지수로, 주요 반도체 기업들의 주가를 반영합니다. 반도체 산업의 업황 및 기술주 전반의 투자 심리를 파악하는 데 사용됩니다.', criteria: [ '📈 <b>상승 추세</b>: 업황 긍정, 기술주 강세 신호', '📉 <b>하락/조정</b>: 업황 둔화 또는 조정 우려' ] }, // 💡 기준값 추가
    auto_sales: { title: '🚗 美 자동차 판매량', seriesId: 'TOTALSA', description: '미국 내 월별 자동차 판매량(연율 환산)입니다. 내구재 소비의 대표적인 지표로, 소비 심리와 경기 상황을 반영합니다.', criteria: [ '📈 <b>증가</b>: 소비 심리 개선, 경기 확장 신호', '📉 <b>감소</b>: 소비 심리 위축, 경기 둔화 신호' ] },
    retail_sales: { title: '🛒 美 소매 판매', seriesId: 'MRTSSM44000USS', description: '미국의 백화점, 온라인 쇼핑 등 다양한 소매 채널의 월별 판매액 변화를 나타냅니다. 미국 소비 활동의 핵심 지표입니다.', criteria: [ '📈 <b>판매 호조</b>: 경기 확장 신호', '📉 <b>판매 부진</b>: 경기 둔화 신호' ] },
    home_price_index: { title: '🏠 美 주택 가격 지수', seriesId: 'CSUSHPINSA', description: 'S&P/Case-Shiller 주택 가격 지수로, 미국 주요 도시의 주택 가격 변동을 측정합니다. 주택 시장은 가계 자산 및 소비 심리에 큰 영향을 미칩니다.', criteria: [ '📈 <b>가격 상승</b>: 시장 활성화, 자산 효과 기대', '📉 <b>가격 하락</b>: 시장 둔화, 소비 위축 우려' ] },
    nfp: { title: '🇺🇸 비농업 고용지수 (NFP)', seriesId: 'PAYEMS', description: '미국의 농업 부문을 제외한 산업 분야의 월간 고용 인구 변동을 나타냅니다. 연준의 통화정책 결정에 큰 영향을 미치는 핵심 고용 지표입니다.', criteria: [ '👍 <b>고용 서프라이즈 (25만 이상)</b>: 경기 과열 우려, 금리 인상 압력', '😐 <b>예상 부합 (15만 ~ 25만)</b>: 안정적 고용 시장', '👎 <b>고용 쇼크 (15만 미만)</b>: 경기 침체 우려, 금리 인하 기대' ] },
    us_cpi: { title: '🇺🇸 소비자물가지수 (CPI)', seriesId: 'CPIAUCSL', description: '미국 도시 소비자들이 구매하는 상품 및 서비스 가격의 평균적인 변화를 측정한 지수입니다. 연준의 물가 목표 달성 여부를 판단하는 핵심 인플레이션 지표입니다.', criteria: [ '😌 <b>물가 안정 (2.5% 이하 YoY)</b>: 연준 목표 부합, 금리 인하 기대', '😐 <b>인플레 둔화 (2.5% ~ 3.5% YoY)</b>: 물가 압력 완화 중', '🔥 <b>물가 압력 지속 (3.5% 초과 YoY)</b>: 연준 긴축 유지 또는 강화 우려' ] },
    philly_fed: { title: '🏭 필라델피아 연은 제조업 지수', seriesId: 'PHLMAN', description: '필라델피아 연방준비은행 관할 지역 제조업체들의 경기 전망을 나타내는 지표입니다. 다른 지역 제조업 지수보다 먼저 발표되어 제조업 경기의 선행 지표로 활용됩니다.', criteria: [ '📈 <b>확장 국면 (10 이상)</b>: 제조업 경기 호조', '😐 <b>보합세 (-5 ~ 10)</b>: 경기 방향성 탐색', '📉 <b>위축 국면 (-5 미만)</b>: 제조업 경기 둔화' ] },
    // 💡 [신규 추가] S&P 500 예측 관련 지표들
    ism_pmi: { title: '🏭 ISM 제조업 PMI', seriesId: 'ISM', description: '미국 공급관리협회(ISM)에서 발표하는 제조업 구매관리자지수입니다. 50 이상은 경기 확장, 50 미만은 경기 위축을 의미하며, 기업 활동과 실물 경제의 방향성을 보여주는 중요한 선행 지표입니다.', criteria: [ '🚀 <b>강한 확장 (55 이상)</b>: 증시 강세 신호', '📈 <b>확장 국면 (50 ~ 55)</b>: 완만한 경기 개선', '⚠️ <b>둔화/위축 우려 (45 ~ 50)</b>: 증시 조정 가능성', '🚨 <b>경기 위축 (45 미만)</b>: 침체 우려, 증시 약세 신호' ] },
    consumer_sentiment: { title: '😊 미시간대 소비자심리지수', seriesId: 'UMCSENT', description: '미시간대학교에서 발표하는 소비자들의 경제 전망 및 소비 태도를 나타내는 지표입니다. 소비 심리는 향후 소비 지출과 경제 성장에 영향을 미치므로 증시에 선행하는 경향이 있습니다.', criteria: [ '😊 <b>소비 심리 낙관 (80 이상)</b>: 증시 긍정적', '😐 <b>소비 심리 중립 (70 ~ 80)</b>: 관망세', '😟 <b>소비 심리 비관 (70 미만)</b>: 증시 부정적' ] },
    copper_price: { title: '닥터 코퍼 (구리 가격)', seriesId: 'PCOPPUSDM', description: '구리는 산업 전반에 사용되어 실물 경제의 건강 상태를 진단하는 데 유용하여 "닥터 코퍼"라고 불립니다. 구리 가격 상승은 경기 회복 또는 확장 기대를 반영하는 경향이 있습니다.', criteria: [ '📈 <b>상승 추세</b>: 경기 회복 기대, 위험자산 선호', '횡보</b>: 방향성 탐색', '📉 <b>하락 추세</b>: 경기 둔화 우려, 위험 회피' ] }, // FRED의 구리 가격 지수 ID (월별)

    // === ECOS (한국) 지표 ===
    gdp_growth: { title: '🇰🇷 GDP 성장률', description: '한국의 경제 규모 성장률입니다. 분기별 실질 GDP의 전기 대비 증감률을 나타냅니다.', criteria: [ '👍 <b>견조한 회복세 (0.7% 이상 QoQ)</b>', '😐 <b>완만한 성장 (0.3% ~ 0.7% QoQ)</b>', '👎 <b>성장 둔화 우려 (0.3% 미만 QoQ)</b>' ] },
    export_growth: { title: '🇰🇷 수출 증가율', description: '한국의 월별 수출 실적의 전년 동월 대비 증감률입니다. 한국 경제의 핵심 동력인 수출 경기를 보여줍니다.', criteria: [ '📈 <b>플러스 전환 (2.0% 이상 YoY)</b>', '📊 <b>소폭 개선 (0% ~ 2.0% YoY)</b>', '📉 <b>수출 부진 (0% 미만 YoY)</b>' ] },
    cpi: { title: '🇰🇷 소비자물가지수 (CPI)', description: '한국 소비자들이 구매하는 상품 및 서비스 가격의 전년 동월 대비 변동률입니다. 한국은행의 통화정책 결정에 중요한 영향을 미칩니다.', criteria: [ '😌 <b>물가 안정세 (3.0% 이하 YoY)</b>: 통화 완화 기대', '😐 <b>인플레이션 둔화 (3.0% ~ 4.0% YoY)</b>: 물가 압력 완화 중', '🔥 <b>물가 압력 지속 (4.0% 초과 YoY)</b>: 통화 긴축 우려' ] },
    unemployment: { title: '🇰🇷 실업률', description: '경제활동인구 중 실업자 비율입니다. 낮은 실업률은 완전고용에 가까운 상태를 의미하며, 높은 실업률은 고용 시장 악화를 나타냅니다.', criteria: [ '💪 <b>완전고용 수준 (3.0% 이하)</b>', '😥 <b>고용 시장 악화 (3.0% 초과)</b>' ] },
    base_rate: { title: '🇰🇷 기준금리', description: '한국은행 금융통화위원회가 결정하는 정책 금리입니다. 물가 안정과 금융 안정을 목표로 조절됩니다.', criteria: [ '💰 <b>완화적 통화정책 (2.5% 이하)</b>', '⚖️ <b>중립적 금리 수준 (2.5% ~ 3.5%)</b>', '🔒 <b>긴축적 통화정책 (3.5% 초과)</b>' ] },
    kor_bond_3y: { title: '🇰🇷 국채 3년 금리', description: '단기 시장 금리의 벤치마크입니다. 금리가 하락하면 채권 가격은 상승하며, 이는 일반적으로 주식 시장에 긍정적입니다.', criteria: [ '✅ <b>금리 안정 (3.5% 이하)</b>', '⚠️ <b>금리 상승 압력 (3.5% ~ 4.0%)</b>', '🚨 <b>고금리 부담 (4.0% 초과)</b>' ] },
    m2_growth: { title: '🇰🇷 M2(광의통화) 증가율', description: '시중 유동성의 양을 보여주는 지표입니다. 높은 증가율은 자산 시장에 유동성 공급이 원활함을 의미하지만, 과도할 경우 인플레이션을 유발할 수 있습니다.', criteria: [ '💧 <b>유동성 적정 (5% ~ 7% YoY)</b>', '〰️ <b>유동성 과잉/부족 우려 (7% 초과 또는 5% 미만 YoY)</b>' ] },
    industrial_production: { title: '🇰🇷 산업생산지수', description: '광업, 제조업 등 주요 산업의 생산 활동 수준을 보여주는 지수(전월 대비 증감률)입니다. 제조업 경기 동향을 파악하는 데 중요합니다.', criteria: [ '🏭 <b>생산 활발 (1.0% 이상 MoM)</b>', '😐 <b>생산 보합 (0% ~ 1.0% MoM)</b>', '📉 <b>생산 위축 (0% 미만 MoM)</b>' ] },
    consumer_sentiment: { title: '🇰🇷 소비자심리지수 (CSI)', description: '소비자들이 느끼는 경기 상황, 가계 수입, 소비 지출 전망 등을 종합한 지수입니다. 100을 기준으로 초과하면 낙관적, 미만이면 비관적임을 의미합니다.', criteria: [ '😊 <b>소비 심리 낙관 (100 이상)</b>', '😐 <b>소비 심리 중립 (90 ~ 100)</b>', '😟 <b>소비 심리 비관 (90 미만)</b>' ] }, // 💡 한국 지표와 ID 중복 피하기 위해 ID 변경 필요 -> 스크립트에서 처리
    corp_bond_spread: { title: '🇰🇷 회사채 스프레드', description: '신용등급 AA- 기준 3년 만기 회사채와 국고채 간의 금리 차이입니다. 스프레드가 확대되면 기업의 자금 조달 비용 증가 및 신용 위험 증가를 의미합니다.', criteria: [ '✅ <b>신용 위험 완화 (0.8%p 이하)</b>', '⚠️ <b>신용 위험 보통 (0.8%p ~ 1.2%p)</b>', '🚨 <b>신용 위험 증가 (1.2%p 초과)</b>' ] },
    kospi: { title: '🇰🇷 코스피 지수', description: '한국거래소 유가증권시장에 상장된 기업들의 주가 수준을 종합적으로 나타내는 대표적인 주가 지수입니다.', criteria: ['📊 <b>주요 시장 지수</b>'] },
    producer_price_index: { title: '🇰🇷 생산자물가지수 (PPI)', description: '국내 생산자가 시장에 공급하는 상품 및 서비스의 가격 변동(전년 동월 대비)을 나타냅니다. 소비자물가지수의 선행 지표 역할을 합니다.', criteria: [ '😌 <b>생산자 물가 안정 (3.0% 이하 YoY)</b>', '🔺 <b>생산자 물가 부담 (3.0% 초과 YoY)</b>' ] }
};

// 💡 한국 소비자심리지수 ID 변경 (미국 지표와 중복 방지)
if (indicatorDetails.consumer_sentiment && indicatorDetails.consumer_sentiment.title.includes('🇰🇷')) {
    const korCsiDetails = indicatorDetails.consumer_sentiment;
    delete indicatorDetails.consumer_sentiment; // 기존 키 삭제
    indicatorDetails.kor_consumer_sentiment = korCsiDetails; // 새 키로 추가
}
