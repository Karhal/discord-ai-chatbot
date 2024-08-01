import config from '../config.js';
import fetch from 'node-fetch';

const braveSearchApiKey = config.braveSearch.apiKey || process.env.BRAVE_SEARCH_API_KEY;
const lang = config.discord.lang;

const getBraveSearch = async (query) => {
    try {
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
        console.log(result);
        console.log({"news": result.news, "web_search": result.web});
        return {"news":result.news, "web_search": result.web};
    } catch (error) {
        throw error;
    }
};

const getLastNewsTool = 
{
    type: 'function',
    function: {
        function: getBraveSearch,
        description: "Use this tool only when you need to make a search on the web. Then interpret the results and provide a summary.",
        parameters: {
        type: 'object',
        properties: {
            query: { type: 'string' }
        },
        },
    },
};

export default getLastNewsTool;