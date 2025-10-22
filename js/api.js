// js/api.js
import { API_KEYS, PROXY_URL } from './config.js';
import { indicatorDetails } from './indicators.js';

// ==================================================================
// 데이터 Fetch 함수들
// ==================================================================

/**
 * FRED API 호출 기본 함수
 */
export async function fetchFredData(seriesId, limit = 1, sortOrder = 'desc', frequency = null, aggregation_method = null) {
    let url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${API_KEYS.FRED}&file_type=json&sort_order=${sortOrder}&limit=${limit}`;
    
    if (frequency) {
        url += `&frequency=${frequency}`;
    }
    if (aggregation_method) {
        url += `&aggregation_method=${aggregation_method}`;
    }
    
    try {
        // console.log(`Requesting FRED: ${url}`); 
        const res = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP 오류: ${res.status} for ${seriesId}`);
        const data = await res.json();
        // console.log(`Response for ${seriesId}:`, data);
        
        if (!data.observations || data.observations.length === 0) {
             console.warn(`FRED returned empty observations for ${seriesId}`);
             return null;
        }
        return data.observations;
        
    } catch (error) {
        console.error(`FRED 데이터 로딩 실패 (${seriesId}):`, error.message); 
        return null;
    }
}

/**
 * 💡 [신규 추가] 최근 6개월 S&P 500 일별 데이터 가져오기
 */
export async function fetchRecentSP500Data() {
    const seriesId = 'SP500';
    const limit = 20000; // [수정] 전체 데이터 (약 70년치)
    const sortOrder = 'asc'; // [수정] 오름차순으로 가져옴
    
    // fetchFredData 함수 재사용 (frequency, aggregation_method 불필요)
    return fetchFredData(seriesId, limit, sortOrder); 
}


/**
 * 주요 FRED 지표들의 최신 값 가져오기
 */
export async function fetchFredIndicators() {
    const fredIndicators = Object.entries(indicatorDetails).filter(([, details]) => details.seriesId);
    
    const promises = fredIndicators.map(async ([key, details]) => {
        
         // console.log(`Processing indicator key: ${key}`);
         
         let result = null; 

        try { 
            // 1. 장단기 금리차 (T10Y2Y)
            if (key === 'yield_spread') {
                const obs = await fetchFredData(details.seriesId, 5, 'desc'); 
                const latestValidObs = obs ? obs.find(o => o.value !== '.') : null;
                if (!latestValidObs) {
                     console.warn(`No valid data found for key: ${key}`);
                     return null;
                }
                const spread = parseFloat(latestValidObs.value);
                result = { id: key, name: details.title, value: spread, unit: "%", date: latestValidObs.date.substring(5) }; 
            } else { // 2. 그 외 일반 FRED 지표 (단일 시리즈 ID)
                
                const obs = await fetchFredData(details.seriesId, 5, 'desc'); 
                const latestValidObs = obs ? obs.find(o => o.value !== '.') : null;

                if (!latestValidObs) {
                    console.warn(`No valid data found for key: ${key}`);
                    return null; 
                }
                
                let value = parseFloat(latestValidObs.value);
                let unit = '';
                let date = latestValidObs.date.substring(5); 

                // 3. 지표별 특수 처리
                if (key === 'nfp') { 
                    value = parseFloat((value / 1000).toFixed(1)); 
                    unit = '만명'; 
                    date = latestValidObs.date.substring(0, 7); // YYYY-MM
                }
                else if (key === 'wti_price') { 
                    unit = '$/bbl'; 
                    date = latestValidObs.date.substring(0, 7); 
                }
                else if (key === 'auto_sales') { 
                    unit = 'M'; 
                    date = latestValidObs.date.substring(0, 7); 
                }
                else if (key === 'us_cpi') {
                    const obs_1y = await fetchFredData(details.seriesId, 13, 'desc'); 
                    if (obs_1y && obs_1y.length > 12 && obs_1y[0].value !== '.' && obs_1y[12].value !== '.') {
                         const currentVal = parseFloat(obs_1y[0].value);
                         const prevVal = parseFloat(obs_1y[12].value);
                         if (prevVal !== 0) { 
                            value = parseFloat(((currentVal - prevVal) / prevVal * 100).toFixed(1));
                            date = obs_1y[0].date.substring(0, 7); 
                            unit = '%';
                         } else {
                             console.warn(`Cannot calculate YoY for ${key}, previous value is 0.`);
                             return null;
                         }
                    } else {
                        console.warn(`Insufficient data for YoY calculation for key: ${key}`);
                        return null; 
                    }
                }
                else if (key === 'ism_pmi') { // NAPM ID 사용 중
                    unit = ''; 
                    date = latestValidObs.date.substring(0, 7); 
                }
                else if (key === 'consumer_sentiment') { // UMCSENT ID 사용 중
                     unit = ''; 
                     date = latestValidObs.date.substring(0, 7); 
                }
                 else if (key === 'copper_price') { // PCOPPUSDM ID 사용 중
                     const obs_1y = await fetchFredData(details.seriesId, 13, 'desc'); 
                    if (obs_1y && obs_1y.length > 12 && obs_1y[0].value !== '.' && obs_1y[12].value !== '.') {
                         const currentVal = parseFloat(obs_1y[0].value);
                         const prevVal = parseFloat(obs_1y[12].value);
                         if (prevVal !== 0) {
                            value = parseFloat(((currentVal - prevVal) / prevVal * 100).toFixed(1));
                            date = obs_1y[0].date.substring(0, 7); 
                            unit = '%';
                         } else {
                              console.warn(`Cannot calculate YoY for ${key}, previous value is 0.`);
                              value = parseFloat(latestValidObs.value); 
                              unit = '$/mt'; 
                              date = latestValidObs.date.substring(0, 7);
                              console.warn("Copper price YoY calculation failed, showing latest value.");
                         }
                    } else {
                         value = parseFloat(latestValidObs.value); 
                         unit = '$/mt'; 
                         date = latestValidObs.date.substring(0, 7);
                         console.warn(`Insufficient data for YoY calculation for key: ${key}, showing latest value.`);
                    }
                } else {
                     // 다른 지표들은 기본 처리 (최신 값, MM-DD 날짜) 유지
                     // 예: exchange_rate, vix, dollar_index, sox_index, philly_fed 등
                }
                
                 if (!isNaN(value)) { 
                     result = { id: key, name: details.title, value, unit, date };
                 } else {
                      console.warn(`Final value is NaN for key: ${key}`);
                      return null; 
                 }
            }
        } catch (error) {
             console.error(`Error processing indicator ${key}:`, error);
             return null; 
        }

        return result; 
        
    });
    const results = await Promise.allSettled(promises);
    
    return results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
}

// ... (fetchEcosIndicators, fetchEcosCycleData 함수는 기존과 동일) ...
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
            kor_consumer_sentiment: { keywords: ['소비자동향조사', '소비자심리지수'] }, // ID 변경됨
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
                if (!found[key] && indicatorDetails[key] && value.keywords.every(kw => stat.KEYSTAT_NAME.includes(kw))) {
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

export async function fetchEcosCycleData() {
    const apiKey = API_KEYS.ECOS;
    const proxy = PROXY_URL;
    
    // 1. 날짜 설정 (최근 10년치)
    const today = new Date();
    const endDate = today.toISOString().slice(0, 7).replace('-', ''); 
    let startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 10);
    startDate.setMonth(startDate.getMonth() + 1); 
    const sDateStr = startDate.toISOString().slice(0, 7).replace('-', ''); 

    // 2. 통계표 및 항목 코드 설정
    const STAT_CODE = '901Y067'; 
    const COINCIDENT_ITEM = 'I16B'; 
    const LEADING_ITEM = 'I16A'; 
    const CYCLE_TYPE = 'M'; 
    const DATA_COUNT = 120; 

    const createUrl = (itemCode) => {
        return `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/${DATA_COUNT}/${STAT_CODE}/${CYCLE_TYPE}/${sDateStr}/${endDate}/${itemCode}`;
    };

    let coincidentData, leadingData;

    try {
        console.log(`ECOS API 요청 (STAT_CODE: ${STAT_CODE}): ${sDateStr} 부터 ${endDate} 까지 (최근 ${DATA_COUNT}개)`);

        const [coincidentRes, leadingRes] = await Promise.all([
            fetch(`${proxy}${encodeURIComponent(createUrl(COINCIDENT_ITEM))}`),
            fetch(`${proxy}${encodeURIComponent(createUrl(LEADING_ITEM))}`)
        ]);

        if (!coincidentRes.ok || !leadingRes.ok) throw new Error("ECOS API 네트워크 응답 오류");

        coincidentData = await coincidentRes.json();
        leadingData = await leadingRes.json();
        
    } catch (error) {
        console.error("ECOS 경기순환지표 fetch 중 네트워크 오류:", error.message);
        return null; 
    }

    // 3. 데이터 검증
    try {
        if (!coincidentData.StatisticSearch || !coincidentData.StatisticSearch.row || coincidentData.StatisticSearch.row.length === 0) {
            let errorMsg = "동행지수(I16B) 데이터가 없습니다.";
            if (coincidentData.RESULT) errorMsg = coincidentData.RESULT.MESSAGE;
            if (coincidentData.INFO) errorMsg = coincidentData.INFO.MESSAGE;
            throw new Error(`동행지수: ${errorMsg}`);
        }
        if (!leadingData.StatisticSearch || !leadingData.StatisticSearch.row || leadingData.StatisticSearch.row.length === 0) {
            let errorMsg = "선행지수(I16A) 데이터가 없습니다.";
            if (leadingData.RESULT) errorMsg = leadingData.RESULT.MESSAGE;
            if (leadingData.INFO) errorMsg = leadingData.INFO.MESSAGE;
            throw new Error(`선행지수: ${errorMsg}`);
        }
        
        return {
            coincident: coincidentData.StatisticSearch.row,
            leading: leadingData.StatisticSearch.row
        };

    } catch (error) {
        console.error(`ECOS 경기순환지표 데이터 로딩 실패: ${error.message}`);
        return null; 
    }
}
