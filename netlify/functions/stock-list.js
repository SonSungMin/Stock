// /netlify/functions/stock-list.js

const KRX_LIST_URL = 'http://data.krx.co.kr/comm/bld/JTI/stock/age/03001/ALL_M.jspx';

// KRX에서 전체 종목 목록을 실시간으로 가져오는 함수
async function fetchAllStocksFromKRX() {
    try {
        console.log('Fetching live stock list from KRX...');
        const response = await fetch(KRX_LIST_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`KRX data request failed with status ${response.status}`);
        }
        
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

// Netlify 함수의 메인 핸들러
exports.handler = async function (event, context) {
    const query = (event.queryStringParameters.query || '').toLowerCase();

    // 검색어가 없으면 아무것도 하지 않음
    if (!query) {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify([]),
        };
    }

    // 1. 항상 KRX에서 최신 전체 목록을 가져옴
    const fullStockList = await fetchAllStocksFromKRX();

    // 2. 가져온 목록에서 사용자의 검색어로 필터링
    const filteredStocks = fullStockList
        .filter(stock => stock.name.toLowerCase().includes(query))
        .slice(0, 10); // 최대 10개 결과만 반환

    // 3. 결과를 반환
    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(filteredStocks),
    };
};
