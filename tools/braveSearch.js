
const { braveSearchApiKey, lang } = require('../config.json');
const fetch = require('node-fetch');

async function getBraveSearch(query) {

    const queryParameters = JSON.parse(query);
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Accept-Encoding", "gzip");
    myHeaders.append("X-Subscription-Token", braveSearchApiKey);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${queryParameters.query}&search_lang=${lang}&count=5&result_filter=news,web`, requestOptions);
    let result = await response.text();
    result = JSON.parse(result);

    console.log({"news":result.news, "web_search": result.web});
    return {"news":result.news, "web_search": result.web};
}

const getLastNewsTool = 
{
    type: 'function',
    function: {
        function: getBraveSearch,
        description: "use this tool when you need to make a search on the web",
        parameters: {
        type: 'object',
        properties: {
            query: { type: 'string' }
        },
        },
    },
}

module.exports = getLastNewsTool;