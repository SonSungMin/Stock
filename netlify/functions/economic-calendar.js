// /netlify/functions/economic-calendar.js

// 실제 서비스에서는 API 키를 환경 변수로 안전하게 관리해야 합니다.
// 여기서는 임시로 간단한 무료 API를 사용합니다.
const CALENDAR_API_URL = 'https://eodhistoricaldata.com/api/economic-events?api_token=demo&fmt=json';

// EOD API의 국가 코드를 국기 이모지로 매핑
const countryToFlag = {
    "KOR": "🇰🇷",
    "USA": "🇺🇸",
    "DEU": "🇩🇪",
    "CHN": "🇨🇳",
    "JPN": "🇯🇵"
};

// EOD API의 중요도를 텍스트로 매핑
const importanceMap = {
    1: '낮음',
    2: '보통',
    3: '높음',
    4: '매우 높음'
};


exports.handler = async function (event, context) {
    try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        // 날짜를 YYYY-MM-DD 형식으로 변환
        const fromDate = sevenDaysAgo.toISOString().split('T')[0];
        
        const response = await fetch(`${CALENDAR_API_URL}&from=${fromDate}`);
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        const data = await response.json();

        // API 응답을 클라이언트에서 사용하기 좋은 형태로 가공
        const formattedEvents = data.map(event => ({
            date: event.date,
            title: `${countryToFlag[event.country] || event.country} ${event.event}`,
            importance: importanceMap[event.importance] || '알 수 없음',
            actual: event.actual,
            forecast: event.previous, // EOD API의 'previous'를 예측치로 사용 (API 스펙에 따라 조정)
            description: event.event // 설명이 따로 없으므로 이벤트 이름 사용
        })).sort((a, b) => new Date(a.date) - new Date(b.date));


        return {
            statusCode: 200,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formattedEvents),
        };
    } catch (error) {
        console.error('경제 캘린더 데이터 처리 중 오류:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '캘린더 데이터를 가져오는 데 실패했습니다.' }),
        };
    }
};
