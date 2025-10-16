// /netlify/functions/stock-list.js

const KRX_API_URL = 'https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd';
let stockListCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1시간

async function fetchAllStocksFromKRX() {
    try {
        if (stockListCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
            return stockListCache;
        }
        
        const params = new URLSearchParams({
            bld: 'dbms/MDC/STAT/standard/MDCSTAT01901',
            locale: 'ko_KR',
            mktId: 'ALL',
            share: '1',
            csvxls_isNo: 'false'
        });

        const response = await fetch(`${KRX_API_URL}?${params.toString()}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader'
            }
        });

        if (!response.ok) throw new Error(`KRX API request failed with status ${response.status}`);
        
        const data = await response.json();
        const stockList = data.OutBlock_1.map(item => ({
            code: item.ISU_SRT_CD,
            name: item.ISU_ABBRV,
            market: item.MKT_NM
        }));

        stockListCache = stockList;
        cacheTimestamp = Date.now();
        return stockList;

    } catch (error) {
        console.error('Error fetching stock list from KRX:', error);
        return getSampleStockList();
    }
}

function getSampleStockList() {
    return [
        { code: '005930', name: '삼성전자', market: 'KOSPI' },
        { code: '000660', name: 'SK하이닉스', market: 'KOSPI' }
    ];
}

exports.handler = async function (event, context) {
    const query = (event.queryStringParameters.query || '').trim().toLowerCase();

    if (!query || query.length < 1) {
        return { statusCode: 200, body: JSON.stringify([]) };
    }

    try {
        const fullStockList = await fetchAllStocksFromKRX();
        const filteredStocks = fullStockList
            .filter(stock => stock.name.toLowerCase().includes(query) || stock.code.includes(query))
            .slice(0, 10);

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(filteredStocks),
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
