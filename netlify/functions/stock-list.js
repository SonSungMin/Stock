// /netlify/functions/stock-list.js

const KRX_LIST_URL = 'http://data.krx.co.kr/comm/bld/JTI/stock/age/03001/ALL_M.jspx';

let cachedStockList = null;
let lastFetchTime = null;
let isFetching = false; // 데이터 가져오는 중복 실행 방지 플래그

async function fetchAndCacheStockList() {
    // 이미 데이터를 가져오는 중이면 추가 실행 방지
    if (isFetching) return; 
    
    isFetching = true;
    console.log('Fetching new stock list from KRX...');
    try {
        const response = await fetch(KRX_LIST_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' }
        });
        if (!response.ok) throw new Error(`KRX request failed: ${response.status}`);
        
        const data = await response.json();
        cachedStockList = data.block1.map(item => ({
            code: item.isu_cd.slice(1),
            name: item.isu_abbrv,
        }));
        lastFetchTime = new Date();
        console.log(`Successfully fetched and cached ${cachedStockList.length} stocks.`);
    } catch (error) {
        console.error('Error fetching stock list from KRX:', error);
        cachedStockList = []; // 에러 발생 시 빈 배열로 초기화하여 재시도 유도
    } finally {
        isFetching = false;
    }
}

// 서버(Lambda)가 처음 시작될 때 바로 종목 목록 가져오기 시도
fetchAndCacheStockList();

exports.handler = async function (event, context) {
    const query = (event.queryStringParameters.query || '').toLowerCase();
    const now = new Date();

    // 1. 캐시가 없거나, 만료(24시간)되었고, 현재 fetch 중이 아닐 때만 새로 가져옴
    if ((!cachedStockList || now - lastFetchTime > 24 * 60 * 60 * 1000) && !isFetching) {
        await fetchAndCacheStockList();
    }
    
    // 2. 준비 상태 확인 요청 처리
    if (event.queryStringParameters.status === 'true') {
        const isReady = cachedStockList && cachedStockList.length > 0;
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                ready: isReady,
                count: isReady ? cachedStockList.length : 0
            }),
        };
    }

    // 3. (목록이 준비되지 않았을 경우) 검색 요청에 빈 배열 반환
    if (!cachedStockList || cachedStockList.length === 0) {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify([]), // 아직 준비 안됨
        };
    }

    // 4. 실제 검색 로직
    const filteredStocks = query
        ? cachedStockList.filter(stock => stock.name.toLowerCase().includes(query)).slice(0, 10)
        : [];

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(filteredStocks),
    };
};
