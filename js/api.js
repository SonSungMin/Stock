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
 * ECOS API는 미래 날짜 조회 시 "데이터 없음"을 반환합니다.
 * 사용자님의 지적대로, 데이터가 발견될 때까지 'endDate'를
 * 1달씩 뒤로 이동하며 최대 6회(6개월)까지 재시도합니다.
 */
export async function fetchEcosCycleData() {
    const apiKey = API_KEYS.ECOS;
    const proxy = PROXY_URL;
    
    const STAT_CODE = '901Y001'; // 경기순환지표
    const COINCIDENT_ITEM = '0001'; // 동행지수 순환변동치
    const LEADING_ITEM = '0002'; // 선행지수 순환변동치
    const CYCLE_TYPE = 'M'; // 월별
    const DATA_COUNT = 120; // 10년치 월 데이터 (120개)

    const createUrl = (itemCode, sDate, eDate) => {
        return `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/${DATA_COUNT}/${STAT_CODE}/${CYCLE_TYPE}/${sDate}/${eDate}/${itemCode}`;
    };

    let currentDate = new Date();
    currentDate.setDate(1); // 날짜 계산 오류 방지를 위해 1일로 설정

    // 최대 6개월(6회)까지 과거로 이동하며 데이터 조회 시도
    for (let i = 0; i < 6; i++) {
        
        if (i > 0) {
            // 0번째 시도(i=0)는 현재 날짜, 이후 1달씩 뒤로 이동
            currentDate.setMonth(currentDate.getMonth() - 1);
        }

        const endDate = currentDate.toISOString().slice(0, 7).replace('-', ''); // 예: 202510

        // 10년 전 (120개월) 날짜 계산
        let startDate = new Date(currentDate);
        startDate.setFullYear(startDate.getFullYear() - 10);
        // ECOS API는 120개 요청 시 startDate가 10년-1달이어야 함 (예: 201511 ~ 202510 = 120개)
        startDate.setMonth(startDate.getMonth() + 1); 
        const sDateStr = startDate.toISOString().slice(0, 7).replace('-', ''); // 예: 201511

        console.log(`ECOS API 시도 (${i + 1}/6): ${sDateStr} 부터 ${endDate} 까지`);

        try {
            const [coincidentRes, leadingRes] = await Promise.all([
                fetch(`${proxy}${encodeURIComponent(createUrl(COINCIDENT_ITEM, sDateStr, endDate))}`),
                fetch(`${proxy}${encodeURIComponent(createUrl(LEADING_ITEM, sDateStr, endDate))}`)
            ]);

            if (!coincidentRes.ok || !leadingRes.ok) throw new Error("API 네트워크 응답 오류");

            const coincidentData = await coincidentRes.json();
            const leadingData = await leadingRes.json();

            // 데이터가 있는지 확인 (row가 존재하고, 비어있지 않은지)
            const hasCoincident = coincidentData.StatisticSearch && coincidentData.StatisticSearch.row && coincidentData.StatisticSearch.row.length > 0;
            const hasLeading = leadingData.StatisticSearch && leadingData.StatisticSearch.row && leadingData.StatisticSearch.row.length > 0;

            if (hasCoincident && hasLeading) {
                // 💡 성공: 데이터를 찾았으므로 즉시 반환
                console.log(`ECOS API 성공: ${endDate} 기준 최신 데이터 발견.`);
                return {
                    coincident: coincidentData.StatisticSearch.row,
                    leading: leadingData.StatisticSearch.row
                };
            }

            // 데이터가 없음 (API가 "해당하는 자료가 없습니다" 등 반환)
            // 콘솔에 로그만 남기고 다음 루프(i++)로 재시도
            if (coincidentData.RESULT) console.warn(`ECOS 동행지수 응답 (${endDate}): ${coincidentData.RESULT.MESSAGE}`);
            else if (leadingData.RESULT) console.warn(`ECOS 선행지수 응답 (${endDate}): ${leadingData.RESULT.MESSAGE}`);
            else console.warn(`ECOS API (${endDate}): 데이터 없음. 1달 전 데이터로 재시도...`);

        } catch (netError) {
            // 네트워크 오류 등 심각한 오류 발생 시 재시도 중단
            console.error("ECOS API 네트워크 오류:", netError.message);
            return null;
        }
    } // end for loop

    // 6회 시도 모두 실패
    console.error("ECOS 경기순환지표 데이터 로딩 실패: 6개월간의 시도 끝에 데이터를 찾을 수 없습니다.");
    return null;
}
