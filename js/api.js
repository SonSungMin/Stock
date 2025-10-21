// js/api.js
import { API_KEYS, PROXY_URL } from './config.js';
import { indicatorDetails } from './indicators.js';

// ==================================================================
// 데이터 Fetch 함수들
// ==================================================================

/**
 * [수정됨]
 * frequency 파라미터를 추가하여 'q'(분기별), 'm'(월별) 등 주기를 지정할 수 있도록
 * FRED API 호출 함수를 확장합니다.
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
        // 💡 디버깅: 실제 요청 URL 확인
        // console.log(`Requesting FRED: ${url}`); 
        const res = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP 오류: ${res.status} for ${seriesId}`);
        const data = await res.json();
         // 💡 디버깅: API 응답 확인
        // console.log(`Response for ${seriesId}:`, data);
        
        // 💡 디버깅: observations가 비어있는지 확인
        if (!data.observations || data.observations.length === 0) {
             console.warn(`FRED returned empty observations for ${seriesId}`);
             return null;
        }
        return data.observations;
        
    } catch (error) {
        // 💡 오류 메시지에 Series ID 포함
        console.error(`FRED 데이터 로딩 실패 (${seriesId}):`, error.message); 
        return null;
    }
}

/**
 * [수정됨]
 * S&P 500 예측 관련 신규 지표(ISM PMI, 소비자심리지수, 구리 가격) 데이터를 가져오는 로직 추가.
 * 구리 가격(월별)은 YoY 변화율을 계산.
 * 💡 디버깅 로그 추가
 */
export async function fetchFredIndicators() {
    const fredIndicators = Object.entries(indicatorDetails).filter(([, details]) => details.seriesId);
    
    const promises = fredIndicators.map(async ([key, details]) => {
        
         // 💡 디버깅: 어떤 키를 처리 중인지 확인
         console.log(`Processing indicator key: ${key}`);
         
         let result = null; // 결과 저장 변수

        try { // 💡 오류 처리를 위해 try...catch 추가
            // 1. 장단기 금리차
            if (key === 'yield_spread') {
                const [obs10Y, obs2Y] = await Promise.all([fetchFredData(details.seriesId[0], 1), fetchFredData(details.seriesId[1], 1)]); // limit=1 명시적 추가
                if (!obs10Y || !obs2Y || obs10Y[0].value === '.' || obs2Y[0].value === '.') {
                     console.warn(`Yield spread data incomplete for key: ${key}`);
                     return null;
                }
                const spread = parseFloat(obs10Y[0].value) - parseFloat(obs2Y[0].value);
                result = { id: key, name: details.title, value: parseFloat(spread.toFixed(2)), unit: "%p", date: obs10Y[0].date.substring(5) };
            } else { // 2. 그 외 일반 FRED 지표 (단일 시리즈 ID)
                
                // 💡 디버깅: ism_pmi 또는 consumer_sentiment 인지 확인
                const isPredictionIndicator = (key === 'ism_pmi' || key === 'consumer_sentiment');
                if (isPredictionIndicator) console.log(`Fetching data for prediction indicator: ${key}`);

                const obs = await fetchFredData(details.seriesId, 1); // 기본 limit=1

                 // 💡 디버깅: fetchFredData 결과 확인
                 if (isPredictionIndicator) console.log(`Raw obs for ${key}:`, obs);

                if (!obs || !obs[0] || obs[0].value === '.') {
                    console.warn(`No valid data found for key: ${key}`);
                    return null; // 데이터 없으면 null 반환하고 다음 지표로
                }

                let value = parseFloat(obs[0].value);
                let unit = '';
                let date = obs[0].date.substring(5); // 기본 날짜 형식 (MM-DD)

                 // 💡 디버깅: 파싱된 값 확인
                 if (isPredictionIndicator) console.log(`Parsed value for ${key}: ${value}`);

                // 3. 지표별 특수 처리
                if (key === 'nfp') { 
                    value = parseFloat((value / 1000).toFixed(1)); 
                    unit = '만명'; 
                }
                else if (key === 'wti_price') { 
                    unit = '$/bbl'; 
                    date = obs[0].date.substring(0, 7); // 월별 데이터 YYYY-MM
                }
                else if (key === 'auto_sales') { 
                    unit = 'M'; 
                    date = obs[0].date.substring(0, 7); // 월별 데이터 YYYY-MM
                }
                // 미국 CPI (YoY 계산)
                else if (key === 'us_cpi') {
                    const obs_1y = await fetchFredData(details.seriesId, 13); 
                    if (obs_1y && obs_1y.length > 12 && obs_1y[0].value !== '.' && obs_1y[12].value !== '.') {
                         const currentVal = parseFloat(obs_1y[0].value);
                         const prevVal = parseFloat(obs_1y[12].value);
                         if (prevVal !== 0) { // 0으로 나누기 방지
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
                // ISM PMI (지수 레벨)
                else if (key === 'ism_pmi') {
                    unit = ''; 
                    date = obs[0].date.substring(0, 7); 
                     // 💡 디버깅: 최종 객체 확인
                     console.log(`Final object for ${key}:`, { id: key, name: details.title, value, unit, date });
                }
                // 미시간대 소비자심리지수 (지수 레벨)
                else if (key === 'consumer_sentiment') {
                     unit = ''; 
                     date = obs[0].date.substring(0, 7); 
                      // 💡 디버깅: 최종 객체 확인
                      console.log(`Final object for ${key}:`, { id: key, name: details.title, value, unit, date });
                }
                 // 구리 가격 (YoY 계산)
                else if (key === 'copper_price') {
                     const obs_1y = await fetchFredData(details.seriesId, 13); 
                    if (obs_1y && obs_1y.length > 12 && obs_1y[0].value !== '.' && obs_1y[12].value !== '.') {
                         const currentVal = parseFloat(obs_1y[0].value);
                         const prevVal = parseFloat(obs_1y[12].value);
                         if (prevVal !== 0) {
                            value = parseFloat(((currentVal - prevVal) / prevVal * 100).toFixed(1));
                            date = obs_1y[0].date.substring(0, 7); 
                            unit = '%';
                         } else {
                              console.warn(`Cannot calculate YoY for ${key}, previous value is 0.`);
                              // YoY 계산 불가 시 최신 레벨 값 사용
                              value = parseFloat(obs[0].value); 
                              unit = '$/mt'; // 단위 명시
                              date = obs[0].date.substring(0, 7);
                              console.warn("Copper price YoY calculation failed, showing latest value.");
                         }
                    } else {
                         // YoY 계산 불가 시 최신 레벨 값 사용
                         value = parseFloat(obs[0].value); 
                         unit = '$/mt'; // 단위 명시
                         date = obs[0].date.substring(0, 7);
                         console.warn(`Insufficient data for YoY calculation for key: ${key}, showing latest value.`);
                    }
                }
                
                // 결과 객체 생성 (오류 없으면)
                 if (!isNaN(value)) { // 최종 value가 유효한 숫자인지 확인
                     result = { id: key, name: details.title, value, unit, date };
                 } else {
                      console.warn(`Final value is NaN for key: ${key}`);
                      return null; // 유효하지 않으면 null 반환
                 }
            }
        } catch (error) {
             console.error(`Error processing indicator ${key}:`, error);
             return null; // 개별 지표 처리 중 오류 발생 시 null 반환
        }

        return result; // 성공 시 결과 객체 반환
        
    });
    // Promise.allSettled를 사용하여 일부 실패해도 나머지는 처리
    const results = await Promise.allSettled(promises);
    
    // 성공한 결과만 필터링하여 반환 (null 제외)
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
        // console.log(` - 선행지수(I16A) URL: ${createUrl(LEADING_ITEM)}`);
        // console.log(` - 동행지수(I16B) URL: ${createUrl(COINCIDENT_ITEM)}`);

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
