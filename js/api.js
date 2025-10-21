// js/api.js
import { API_KEYS, PROXY_URL } from './config.js';
import { indicatorDetails } from './indicators.js';

// ==================================================================
// 데이터 Fetch 함수들
// ==================================================================

/**
 * 💡 [수정됨]
 * frequency 파라미터를 추가하여 'q'(분기별), 'm'(월별) 등 주기를 지정할 수 있도록
 * FRED API 호출 함수를 확장합니다.
 */
export async function fetchFredData(seriesId, limit = 1, sortOrder = 'desc', frequency = null) {
    let url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${API_KEYS.FRED}&file_type=json&sort_order=${sortOrder}&limit=${limit}`;
    
    // 💡 frequency 파라미터가 있으면 URL에 추가
    if (frequency) {
        url += `&frequency=${frequency}`;
    }
    
    try {
        const res = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP 오류: ${res.status}`);
        const data = await res.json();
        return (data.observations && data.observations.length > 0) ? data.observations : null;
    } catch (error) {
        console.error(`FRED 데이터 로딩 실패 (${seriesId}):`, error);
        return null;
    }
}

export async function fetchFredIndicators() {
    const fredIndicators = Object.entries(indicatorDetails).filter(([, details]) => details.seriesId);
    
    const promises = fredIndicators.map(async ([key, details]) => {
        if (key === 'yield_spread') {
            const [obs10Y, obs2Y] = await Promise.all([fetchFredData(details.seriesId[0]), fetchFredData(details.seriesId[1])]);
            if (!obs10Y || !obs2Y || obs10Y[0].value === '.' || obs2Y[0].value === '.') return null;
            const spread = parseFloat(obs10Y[0].value) - parseFloat(obs2Y[0].value);
            return { id: key, name: details.title, value: parseFloat(spread.toFixed(2)), unit: "%p", date: obs10Y[0].date.substring(5) };
        }

        const obs = await fetchFredData(details.seriesId);
        if (!obs || !obs[0] || obs[0].value === '.') return null;

        let value = parseFloat(obs[0].value);
        let unit = '';

        if (key === 'nfp') { value = parseFloat((value / 1000).toFixed(1)); unit = '만명'; }
        else if (key === 'wti_price') { unit = '$/bbl'; }
        else if (key === 'auto_sales') { unit = 'M'; }
        else if (key === 'us_cpi') {
            const obs_1y = await fetchFredData(details.seriesId, 13);
            if (obs_1y && obs_1y.length > 12) {
                 value = parseFloat(((parseFloat(obs_1y[0].value) - parseFloat(obs_1y[12].value)) / parseFloat(obs_1y[12].value) * 100).toFixed(1));
            } else {
                return null;
            }
            unit = '%';
        }
        
        return { id: key, name: details.title, value, unit, date: obs[0].date.substring(5) };
    });
    return Promise.all(promises);
}

export async function fetchEcosIndicators() {
    const ecosApiUrl = `https://ecos.bok.or.kr/api/KeyStatisticList/${API_KEYS.ECOS}/json/kr/1/100`;
    try {
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(ecosApiUrl)}`);
        if (!response.ok) throw new Error("ECOS API 응답 오류");
        const data = await response.json();
        
        if (!data.KeyStatisticList || !data.KeyStatisticList.row) {
            if (data.RESULT) {
                console.error("ECOS KeyStatisticList API 오류:", data.RESULT.MESSAGE);
            } else {
                console.error("ECOS KeyStatisticList 응답 형식이 올바르지 않습니다.", data);
            }
            return [];
        }
        
        const allStats = data.KeyStatisticList.row;
        const mapping = {
            gdp_growth: { keywords: ['분기', 'GDP', '성장률'] },
            export_growth: { keywords: ['수출', '총액', '증감률'] },
            unemployment: { keywords: ['실업률'] },
            industrial_production: { keywords: ['산업생산지수'] },
            consumer_sentiment: { keywords: ['소비자동향조사', '소비자심리지수'] },
            base_rate: { keywords: ['기준금리'] },
            cpi: { keywords: ['소비자물가지수', '총지수', '증감률'] },
            kospi: { keywords: ['KOSPI'] },
            producer_price_index: { keywords: ['생산자물가지수', '총지수', '등락률'] },
            corp_bond_spread: { keywords: ['회사채', '수익률', '스프레드'] },
            kor_bond_3y: { keywords: ['국고채', '3년'] },
            m2_growth: { keywords: ['M2', '광의통화', '증감률'] },
        };
        
        const found = {};
        allStats.forEach(stat => {
            for (const [key, value] of Object.entries(mapping)) {
                if (!found[key] && value.keywords.every(kw => stat.KEYSTAT_NAME.includes(kw))) {
                    if (stat.TIME && stat.DATA_VALUE && stat.TIME.length >= 8) {
                        found[key] = {
                            id: key, name: indicatorDetails[key].title, value: parseFloat(stat.DATA_VALUE),
                            unit: stat.UNIT_NAME, date: stat.TIME.substring(4, 6) + '-' + stat.TIME.substring(6, 8)
                        };
                    }
                }
            }
        });
        return Object.values(found);
    } catch (error) {
        console.error("한국은행 데이터 로딩 실패:", error);
        return [];
    }
}

/**
 * [수정됨]
 * 1. "2008년" 데이터가 나오던 오류 수정
 * 2. START_DATE를 '10년 전'으로 동적 계산 (잘못된 '200001' 고정값 제거)
 * 3. DATA_COUNT를 '120'개 (10년치)로 수정 (잘못된 '100' 고정값 제거)
 * 4. STAT_CODE('901Y067')와 ITEM_CODE('I16A', 'I16B')는 올바르게 유지
 */
export async function fetchEcosCycleData() {
    const apiKey = API_KEYS.ECOS;
    const proxy = PROXY_URL;
    
    // 1. 날짜 설정 (최근 10년치)
    const today = new Date();
    const endDate = today.toISOString().slice(0, 7).replace('-', ''); // 예: 202510

    // 10년 전 (120개월) 날짜 계산
    let startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 10);
    startDate.setMonth(startDate.getMonth() + 1); // 10년 전의 다음 달
    const sDateStr = startDate.toISOString().slice(0, 7).replace('-', ''); // 예: 201511

    // 2. 통계표 및 항목 코드 설정
    const STAT_CODE = '901Y067'; // 💡 올바른 코드
    const COINCIDENT_ITEM = 'I16B'; // 💡 동행지수
    const LEADING_ITEM = 'I16A'; // 💡 선행지수
    const CYCLE_TYPE = 'M'; // 월별
    const DATA_COUNT = 120; // 💡 10년치 (120개)

    const createUrl = (itemCode) => {
        // ECOS API는 startDate, endDate가 있어도 DATA_COUNT(120)를 최신순으로 우선합니다.
        return `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/${DATA_COUNT}/${STAT_CODE}/${CYCLE_TYPE}/${sDateStr}/${endDate}/${itemCode}`;
    };

    let coincidentData, leadingData;

    try {
        console.log(`ECOS API 요청 (STAT_CODE: ${STAT_CODE}): ${sDateStr} 부터 ${endDate} 까지 (최근 ${DATA_COUNT}개)`);
        console.log(` - 선행지수(I16A) URL: ${createUrl(LEADING_ITEM)}`);
        console.log(` - 동행지수(I16B) URL: ${createUrl(COINCIDENT_ITEM)}`);

        const [coincidentRes, leadingRes] = await Promise.all([
            fetch(`${proxy}${encodeURIComponent(createUrl(COINCIDENT_ITEM))}`),
            fetch(`${proxy}${encodeURIComponent(createUrl(LEADING_ITEM))}`)
        ]);

        if (!coincidentRes.ok || !leadingRes.ok) throw new Error("ECOS API 네트워크 응답 오류");

        coincidentData = await coincidentRes.json();
        leadingData = await leadingRes.json();
        
    } catch (error) {
        console.error("ECOS 경기순환지표 fetch 중 네트워크 오류:", error.message);
        return null; // 네트워크 오류 시 null 반환
    }

    // 3. 데이터 검증
    try {
        // 1. 동행지수 데이터 확인
        if (!coincidentData.StatisticSearch || !coincidentData.StatisticSearch.row || coincidentData.StatisticSearch.row.length === 0) {
            let errorMsg = "동행지수(I16B) 데이터가 없습니다.";
            if (coincidentData.RESULT) errorMsg = coincidentData.RESULT.MESSAGE;
            if (coincidentData.INFO) errorMsg = coincidentData.INFO.MESSAGE;
            throw new Error(`동행지수: ${errorMsg}`);
        }

        // 2. 선행지수 데이터 확인
        if (!leadingData.StatisticSearch || !leadingData.StatisticSearch.row || leadingData.StatisticSearch.row.length === 0) {
            let errorMsg = "선행지수(I16A) 데이터가 없습니다.";
            if (leadingData.RESULT) errorMsg = leadingData.RESULT.MESSAGE;
            if (leadingData.INFO) errorMsg = leadingData.INFO.MESSAGE;
            throw new Error(`선행지수: ${errorMsg}`);
        }
        
        // 3. 모든 검증 통과
        return {
            coincident: coincidentData.StatisticSearch.row,
            leading: leadingData.StatisticSearch.row
        };

    } catch (error) {
        console.error(`ECOS 경기순환지표 데이터 로딩 실패: ${error.message}`);
        return null; 
    }
}
