// /netlify/functions/proxy.js

exports.handler = async function (event, context) {
    // 클라이언트(index.html)가 요청한 실제 API 주소를 가져옵니다.
    const targetUrl = event.queryStringParameters.targetUrl;

    if (!targetUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'targetUrl 파라미터가 필요합니다.' }),
        };
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(decodeURIComponent(targetUrl));
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // CORS 허용
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '데이터를 가져오는 데 실패했습니다.' }),
        };
    }
};
