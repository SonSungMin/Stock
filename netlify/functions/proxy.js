// /netlify/functions/proxy.js

// node-fetch를 import합니다.
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function (event, context) {
    const targetUrl = event.queryStringParameters.targetUrl;

    if (!targetUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'targetUrl 파라미터가 필요합니다.' }),
        };
    }

    try {
        const response = await fetch(decodeURIComponent(targetUrl));
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
