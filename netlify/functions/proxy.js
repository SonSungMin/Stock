// /netlify/functions/proxy.js

exports.handler = async function (event, context) {
    const targetUrl = event.queryStringParameters.targetUrl;

    if (!targetUrl) {
        return { statusCode: 400, body: 'targetUrl 파라미터가 필요합니다.' };
    }

    try {
        // Netlify의 내장 fetch 기능을 바로 사용합니다. (node-fetch 불필요)
        const response = await fetch(decodeURIComponent(targetUrl));
        const data = await response.json();

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
