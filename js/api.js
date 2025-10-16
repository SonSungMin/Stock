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
        if (!data.KeyStatisticList || !data.KeyStatisticList.row) return [];
        
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
        };
        
        const found = {};
        allStats.forEach(stat => {
            for (const [key, value] of Object.entries(mapping)) {
                if (!found[key] && value.keywords.every(kw => stat.KEYSTAT_NAME.includes(kw))) {
                    // 💡 변경된 부분: stat.TIME이 유효한지 먼저 확인합니다.
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
