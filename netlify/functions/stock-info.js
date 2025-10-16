// /netlify/functions/stock-info.js
const KIS_API_URL = 'https://openapivts.koreainvestment.com:29443'; // 모의투자 URL
const APP_KEY = 'YOUR_APP_KEY';       // 여기에 발급받은 App Key를 넣으세요.
const APP_SECRET = 'YOUR_APP_SECRET'; // 여기에 발급받은 App Secret을 넣으세요.

let ACCESS_TOKEN = null;
let TOKEN_EXPIRES_AT = null;

async function getAccessToken() {
    if (ACCESS_TOKEN && TOKEN_EXPIRES_AT && new Date() < TOKEN_EXPIRES_AT) {
        return ACCESS_TOKEN;
    }
    try {
        const url = `${KIS_API_URL}/oauth2/tokenP`;
        const body = JSON.stringify({ grant_type: 'client_credentials', appkey: APP_KEY, appsecret: APP_SECRET });
        const response = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body });
        const data = await response.json();
        if (data.access_token) {
            ACCESS_TOKEN = data.access_token;
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

async function fetchKisApi(path, tr_id, params = {}) {
    const token = await getAccessToken();
    if (!token) throw new Error('Authentication failed');
    
    const url = `${KIS_API_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, 'appkey': APP_KEY, 'appsecret': APP_SECRET,
        'tr_id': tr_id, 'custtype': 'P',
    };
    const query = new URLSearchParams(params).toString();
    const fullUrl = `${url}?${query}`;
    const response = await fetch(fullUrl, { headers });
    return response.json();
}

exports.handler = async function (event, context) {
    const stockCode = event.queryStringParameters.code;
    if (!stockCode) return { statusCode: 400, body: '종목 코드(code) 파라미터가 필요합니다.' };
    
    if (APP_KEY === 'YOUR_APP_KEY' || APP_SECRET === 'YOUR_APP_SECRET') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(getSampleData(stockCode)) };
    }

    try {
        const [priceRes, dailyChartRes] = await Promise.all([
            fetchKisApi('/uapi/domestic-stock/v1/quotations/inquire-price', 'FHKST01010100', { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: stockCode }),
            fetchKisApi('/uapi/domestic-stock/v1/quotations/inquire-daily-price', 'FHKST01010400', { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: stockCode, FID_PERIOD_DIV_CODE: 'D', FID_ORG_ADJ_PRC: '1' })
        ]);
        const formattedData = {
            priceInfo: priceRes.output,
            dailyChart: dailyChartRes.output.slice(0, 30).reverse()
        };
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(formattedData) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

function getSampleData(stockCode) {
    return {
        priceInfo: { stck_prpr: "80,000", prdy_vrss: "1,200", prdy_ctrt: "1.52", stck_shrn_iscd: stockCode, per: "15.8", pbr: "1.6", dps: "1444", hts_avls: "477693440000000", stck_kr_abrv: "삼성전자 (샘플)" },
        dailyChart: Array.from({length: 30}, (_, i) => ({ stck_bsop_date: `202509${String(i+1).padStart(2, '0')}`, stck_clpr: String(78000 + Math.floor(Math.random() * 5000) - 2500) })),
        financialInfo: { annual: [ { year: '2022', revenue: '302조', profit: '43조' }, { year: '2023', revenue: '258조', profit: '6.5조' }, { year: '2024(E)', revenue: '280조', profit: '25조' } ] }
    };
}
