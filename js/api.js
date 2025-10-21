// js/api.js
import { API_KEYS, PROXY_URL } from './config.js';
import { indicatorDetails } from './indicators.js';

// ==================================================================
// 데이터 Fetch 함수들
// ==================================================================
export async function fetchFredData(seriesId, limit = 1, sortOrder = 'desc') {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${API_KEYS.FRED}&file_type=json&sort_order=${sortOrder}&limit=${limit}`;
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
 * 💡 [수정됨]
 * ECOS API에서 10년치(120개월) 경기순환지표 데이터를 가져옵니다.
 * "해당하는 데이터가 없습니다" 오류를 피하기 위해, '오늘'이 아닌 '2달 전'을
 * 기준으로 endDate를 설정하여 데이터 발표 시차를 반영합니다.
 */
export async function fetchEcosCycleData() {
    const apiKey = API_KEYS.ECOS;
    const proxy = PROXY_URL;
    
    // 💡 [오류 수정 지점]
    // ECOS 데이터는 1~2달 늦게 발표됩니다.
    // '오늘'이 아닌 '2달 전'을 기준으로 endDate를 설정해야
    // "해당하는 데이터가 없습니다" 오류를 피할 수 있습니다.
    const today = new Date();
    today.setDate(1); // 날짜 계산 오류 방지를 위해 1일로 설정
    today.setMonth(today.getMonth() - 2); // 2달 전으로 설정 (데이터 발표 여유 확보)

    const endDate = today.toISOString().slice(0, 7).replace('-', ''); // 예: 202508
    
    // startDate는 endDate로부터 10년 전
    today.setFullYear(today.getFullYear() - 10);
    const startDate = today.toISOString().slice(0, 7).replace('-', ''); // 예: 201508

    const STAT_CODE = '901Y001'; // 경기순환지표
    const COINCIDENT_ITEM = '0001'; // 동행지수 순환변동치
    const LEADING_ITEM = '0002'; // 선행지수 순환변동치
    const CYCLE_TYPE = 'M'; // 월별
    const DATA_COUNT = 120; // 10년치 월 데이터

    const createUrl = (itemCode) => {
        return `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/${DATA_COUNT}/${STAT_CODE}/${CYCLE_TYPE}/${startDate}/${endDate}/${itemCode}`;
    };

    try {
        // 💡 콘솔에 실제 요청 URL을 남겨 디버깅을 돕습니다.
        console.log("ECOS API 요청 시작 (선행/동행):", startDate, "to", endDate);

        const [coincidentRes, leadingRes] = await Promise.all([
            fetch(`${proxy}${encodeURIComponent(createUrl(COINCIDENT_ITEM))}`),
            fetch(`${proxy}${encodeURIComponent(createUrl(LEADING_ITEM))}`)
        ]);

        if (!coincidentRes.ok || !leadingRes.ok) throw new Error("ECOS 경기순환지표 API 네트워크 응답 오류");

        const coincidentData = await coincidentRes.json();
        const leadingData = await leadingRes.json();
        
        // 1. 동행지수 데이터 확인
        if (!coincidentData.StatisticSearch || !coincidentData.StatisticSearch.row) {
            let errorMsg = "동행지수 데이터 형식이 올바르지 않습니다.";
            if (coincidentData.RESULT) errorMsg = coincidentData.RESULT.MESSAGE;
            if (coincidentData.INFO) errorMsg = coincidentData.INFO.MESSAGE;
            // 💡 콘솔에 API가 반환한 실제 응답을 남깁니다.
            console.error("ECOS 동행지수 API 실패 응답:", coincidentData);
            throw new Error(errorMsg); // "해당하는 데이터가 없습니다."
        }

        // 2. 선행지수 데이터 확인
        if (!leadingData.StatisticSearch || !leadingData.StatisticSearch.row) {
            let errorMsg = "선행지수 데이터 형식이 올바르지 않습니다.";
            if (leadingData.RESULT) errorMsg = leadingData.RESULT.MESSAGE;
            if (leadingData.INFO) errorMsg = leadingData.INFO.MESSAGE;
            // 💡 콘솔에 API가 반환한 실제 응답을 남깁니다.
            console.error("ECOS 선행지수 API 실패 응답:", leadingData);
            throw new Error(errorMsg); // "해당하는 데이터가 없습니다."
        }

        // 3. 데이터가 비어있는지 확인
        if (coincidentData.StatisticSearch.row.length === 0 || leadingData.StatisticSearch.row.length === 0) {
            throw new Error("API에서 반환된 경기 순환 데이터가 비어있습니다.");
        }

        // 모든 검증 통과
        return {
            coincident: coincidentData.StatisticSearch.row,
            leading: leadingData.StatisticSearch.row
        };

    } catch (error) {
        // 여기서 잡힌 에러는 위에서 throw한 명시적인 에러 메시지가 됩니다.
        console.error("ECOS 경기순환지표 데이터 로딩 실패:", error.message);
        return null; 
    }
}
