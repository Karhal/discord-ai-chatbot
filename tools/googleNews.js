const { getJson } = require("serpapi");
const { serpApiKey, lang, serpGoogle_domain } = require('../config.json');

async function getGoogleNews(query) {
    try {
        const queryParameters = JSON.parse(query);

        const response = await getJson({
            api_key: serpApiKey,
            engine: "google",
            q: queryParameters.query,
            google_domain: serpGoogle_domain,
            gl: lang,
            hl: lang,
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
        description: "use this tool only when you need to get fresh news from Google",
        parameters: {
        type: 'object',
        properties: {
            query: { type: 'string' }
        },
        },
    },
}

module.exports = getGoogleNewsTool;