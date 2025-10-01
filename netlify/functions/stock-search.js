// /netlify/functions/stock-search.js
const { stockList } = require('./stock-list');

exports.handler = async function (event, context) {
    const query = (event.queryStringParameters.query || '').toLowerCase();

    if (!query) {
        return {
            statusCode: 200,
            body: JSON.stringify([]),
        };
    }

    const filteredStocks = stockList
        .filter(stock => stock.name.toLowerCase().includes(query))
        .slice(0, 10); // 최대 10개 결과만 반환

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(filteredStocks),
    };
};
