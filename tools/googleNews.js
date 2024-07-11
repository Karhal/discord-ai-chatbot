const { getJson } = require("serpapi");
const { serpApiKey, serpApiLang } = require('../config.json');

async function getGoogleNews(query) {
    try {
        const queryParameters = JSON.parse(query);

        const response = await getJson({
            api_key: serpApiKey,
            engine: "google",
            q: queryParameters.query,
            location: "France",
            google_domain: "google.fr",
            gl: serpApiLang,
            hl: serpApiLang,
            tbm: "nws"
          }, (json) => {
            console.log(json);
          });

        console.log(response);
        return response;
    } catch (error) {
        console.error(error);
    }
}

const getGoogleNewsTool = 
{
    type: 'function',
    function: {
        function: getGoogleNews,
        description: "use this tool only when you need to get news from Google",
        parameters: {
        type: 'object',
        properties: {
            query: { type: 'string' }
        },
        },
    },
}

module.exports = getGoogleNewsTool;