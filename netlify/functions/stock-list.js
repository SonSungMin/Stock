// /netlify/functions/stock-list.js

// 한국거래소 OpenAPI - 전종목 기본정보
const KRX_API_URL = 'http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd';

// 로컬 캐시 (메모리)
let stockListCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1시간

// KRX에서 전체 종목 목록을 실시간으로 가져오는 함수
async function fetchAllStocksFromKRX() {
    try {
        // 캐시가 유효하면 재사용
        if (stockListCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
            console.log('Using cached stock list');
            return stockListCache;
        }

        console.log('Fetching live stock list from KRX...');
        
        // KRX API 요청 파라미터
        const params = new URLSearchParams({
            bld: 'dbms/MDC/STAT/standard/MDCSTAT01901',
            locale: 'ko_KR',
            mktId: 'ALL', // STK: 코스피, KSQ: 코스닥, ALL: 전체
            share: '1',
            csvxls_isNo: 'false'
        });

        const response = await fetch(`${KRX_API_URL}?${params.toString()}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader'
            }
        });

        if (!response.ok) {
            throw new Error(`KRX API request failed with status ${response.status}`);
        }
        
        const data = await response.json();

        if (!data.OutBlock_1 || !Array.isArray(data.OutBlock_1)) {
            console.error('Unexpected KRX API response format:', data);
            throw new Error('Invalid response format from KRX');
        }

        // KRX 응답 형식에 맞춰 파싱
        const stockList = data.OutBlock_1.map(item => ({
            code: item.ISU_SRT_CD, // 종목 코드 (6자리)
            name: item.ISU_ABBRV,  // 종목명 (한글)
            market: item.MKT_NM    // 시장구분 (코스피/코스닥)
        }));

        // 캐시 저장
        stockListCache = stockList;
        cacheTimestamp = Date.now();
        
        console.log(`Successfully fetched ${stockList.length} stocks from KRX`);
        return stockList;

    } catch (error) {
        console.error('Error fetching stock list from KRX:', error);
        
        // 에러 발생 시, 캐시가 있으면 반환
        if (stockListCache) {
            console.log('Using stale cache due to error');
            return stockListCache;
        }
        
        // 캐시도 없으면 샘플 데이터 반환
        return getSampleStockList();
    }
}

// 샘플 종목 목록 (KRX API 실패 시 대체용)
function getSampleStockList() {
    console.log('Using sample stock list');
    return [
        { code: '005930', name: '삼성전자', market: 'KOSPI' },
        { code: '000660', name: 'SK하이닉스', market: 'KOSPI' },
        { code: '005380', name: '현대차', market: 'KOSPI' },
        { code: '000270', name: '기아', market: 'KOSPI' },
        { code: '051910', name: 'LG화학', market: 'KOSPI' },
        { code: '006400', name: '삼성SDI', market: 'KOSPI' },
        { code: '035720', name: '카카오', market: 'KOSPI' },
        { code: '035420', name: 'NAVER', market: 'KOSPI' },
        { code: '207940', name: '삼성바이오로직스', market: 'KOSPI' },
        { code: '068270', name: '셀트리온', market: 'KOSPI' },
        { code: '005490', name: 'POSCO홀딩스', market: 'KOSPI' },
        { code: '028260', name: '삼성물산', market: 'KOSPI' },
        { code: '105560', name: 'KB금융', market: 'KOSPI' },
        { code: '055550', name: '신한지주', market: 'KOSPI' },
        { code: '012330', name: '현대모비스', market: 'KOSPI' },
        { code: '066570', name: 'LG전자', market: 'KOSPI' },
        { code: '003670', name: '포스코퓨처엠', market: 'KOSPI' },
        { code: '096770', name: 'SK이노베이션', market: 'KOSPI' },
        { code: '009150', name: '삼성전기', market: 'KOSPI' },
        { code: '017670', name: 'SK텔레콤', market: 'KOSPI' }
    ];
}
