// /netlify/functions/stock-info.js

// KIS(한국투자증권) API 관련 정보
// 중요: 이 부분은 실제 서비스 시 Netlify 환경 변수 등으로 안전하게 관리해야 합니다.
const KIS_API_URL = 'https://openapivts.koreainvestment.com:29443'; // 모의투자 URL
const APP_KEY = 'YOUR_APP_KEY';         // 여기에 발급받은 App Key를 넣으세요.
const APP_SECRET = 'YOUR_APP_SECRET';   // 여기에 발급받은 App Secret을 넣으세요.

let ACCESS_TOKEN = null;
let TOKEN_EXPIRES_AT = null;

// 접근 토큰 발급 함수
async function getAccessToken() {
    // 토큰이 유효하면 재사용
    if (ACCESS_TOKEN && TOKEN_EXPIRES_AT && new Date() < TOKEN_EXPIRES_AT) {
        return ACCESS_TOKEN;
    }

    try {
        const url = `${KIS_API_URL}/oauth2/tokenP`;
        const headers = { 'Content-Type': 'application/json' };
        const body = JSON.stringify({
            grant_type: 'client_credentials',
            appkey: APP_KEY,
            appsecret: APP_SECRET,
        });

        const response = await fetch(url, { method: 'POST', headers, body });
        const data = await response.json();

        if (data.access_token) {
            ACCESS_TOKEN = data.access_token;
            // 토큰 만료 시간 (1시간) 보다 조금 일찍 갱신하도록 설정
            TOKEN_EXPIRES_AT = new Date(new Date().getTime() + (data.expires_in - 300) * 1000);
            return ACCESS_TOKEN;
        } else {
            throw new Error('Failed to retrieve access token');
        }
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
}

// API 호출 래퍼 함수
async function fetchKisApi(path, tr_id, params = {}) {
    const token = await getAccessToken();
    if (!token) {
        throw new Error('Authentication failed');
    }

    const url = `${KIS_API_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'appkey': APP_KEY,
        'appsecret': APP_SECRET,
        'tr_id': tr_id,
        'custtype': 'P',
    };
    
    const query = new URLSearchParams(params).toString();
    const fullUrl = `${url}?${query}`;
    
    const response = await fetch(fullUrl, { headers });
    return response.json();
}


exports.handler = async function (event, context) {
    const stockCode = event.queryStringParameters.code;

    if (!stockCode) {
        return { statusCode: 400, body: '종목 코드(code) 파라미터가 필요합니다.' };
    }
    
    if (APP_KEY === 'YOUR_APP_KEY' || APP_SECRET === 'YOUR_APP_SECRET') {
         // API 키가 입력되지 않았을 경우, 삼성전자 샘플 데이터 반환
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(getSampleData(stockCode)),
        };
    }

    try {
        // 병렬로 API 호출
        const [priceRes, dailyChartRes] = await Promise.all([
            // 현재가 정보
            fetchKisApi('/uapi/domestic-stock/v1/quotations/inquire-price', 'FHKST01010100', { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: stockCode }),
            // 일봉 데이터
            fetchKisApi('/uapi/domestic-stock/v1/quotations/inquire-daily-price', 'FHKST01010400', { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: stockCode, FID_PERIOD_DIV_CODE: 'D', FID_ORG_ADJ_PRC: '1' })
        ]);

        const formattedData = {
            priceInfo: priceRes.output,
            dailyChart: dailyChartRes.output.slice(0, 30).reverse() // 최근 30일 데이터
        };

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(formattedData),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

// API 키가 없을 때 사용할 샘플 데이터
function getSampleData(stockCode) {
    return {
        priceInfo: {
            stck_prpr: "80,000", // 현재가
            prdy_vrss: "1,200",  // 전일 대비
            prdy_ctrt: "1.52",  // 등락률
            stck_oprc: "79,500", // 시가
            stck_hgpr: "80,200", // 고가
            stck_lwpr: "79,300", // 저가
            acml_vol: "15,000,000", // 거래량
            stck_shrn_iscd: stockCode,
            stck_prdy_clpr: "78,800", // 전일 종가
            per: "15.8",
            pbr: "1.6",
            eps: "5,063",
            bps: "50,000",
            dps: "1,444",
            stck_hgst_52w_prc: "95,000",
            stck_lwst_52w_prc: "68,000",
            hts_avls: "120000000000000", // 시가총액
            stck_kr_abrv: "삼성전자"
        },
        dailyChart: Array.from({length: 30}, (_, i) => ({
            stck_bsop_date: `202509${String(i+1).padStart(2, '0')}`,
            stck_clpr: String(78000 + Math.floor(Math.random() * 5000) - 2500),
            acml_vol: String(10000000 + Math.floor(Math.random() * 5000000))
        })),
        // KIS API는 재무정보를 별도 API로 호출해야 합니다. 여기서는 샘플로 추가합니다.
        financialInfo: {
            annual: [
                { year: '2022', revenue: '302조', profit: '43조' },
                { year: '2023', revenue: '258조', profit: '6.5조' },
                { year: '2024(E)', revenue: '280조', profit: '25조' },
            ]
        }
    };
}
