// /netlify/functions/stock-list.js

const fetch = require('node-fetch'); // node-fetch를 사용하기 위해 추가

// KRX 정보데이터시스템의 전체 종목 목록 API
const KRX_LIST_URL = 'http://data.krx.co.kr/comm/bld/JTI/stock/age/03001/ALL_M.jspx';

let cachedStockList = null;
let lastFetchTime = null;

// KRX에서 전체 종목 목록을 가져오는 함수
async function fetchAllStocksFromKRX() {
    try {
        const response = await fetch(KRX_LIST_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
        });
        const data = await response.json();
        
        // KRX 응답 형식에 맞춰 파싱
        return data.block1.map(item => ({
            code: item.isu_cd.slice(1), // 'A005930' -> '005930'
            name: item.isu_abbrv,
        }));

    } catch (error) {
        console.error('Error fetching stock list from KRX:', error);
        return []; // 에러 발생 시 빈 배열 반환
    }
}

exports.handler = async function (event, context) {
    const query = (event.queryStringParameters.query || '').toLowerCase();
    const now = new Date();
    
    // 하루 이상 지났거나 캐시가 없으면 KRX에서 새로 데이터를 가져옴
    if (!cachedStockList || !lastFetchTime || now - lastFetchTime > 24 * 60 * 60 * 1000) {
        console.log('Fetching new stock list from KRX...');
        cachedStockList = await fetchAllStocksFromKRX();
        lastFetchTime = now;
        console.log(`Fetched ${cachedStockList.length} stocks.`);
    }

    if (!query) {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify([]),
        };
    }

    const filteredStocks = cachedStockList
        .filter(stock => stock.name.toLowerCase().includes(query))
        .slice(0, 10); // 최대 10개 결과만 반환

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(filteredStocks),
    };
};
