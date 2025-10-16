// js/config.js

// ==================================================================
// API 키와 프록시 URL 설정
// ==================================================================
export const API_KEYS = {
    FRED: '480b8d74e3d546674e8180193c30dbf6', // 여기에 FRED API 키를 입력하세요.
    ECOS: 'C4UHXGGIUUZ1TNZJOXFM'  // 여기에 ECOS API 키를 입력하세요.
};
export const PROXY_URL = '/.netlify/functions/proxy?targetUrl=';
export const STOCK_INFO_URL = '/.netlify/functions/stock-info?code=';
export const STOCK_SEARCH_URL = '/.netlify/functions/stock-list?query=';
