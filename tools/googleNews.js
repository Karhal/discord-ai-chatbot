const { getJson } = require("serpapi");
const { serpApiKey } = require('../config.json');

async function getGoogleNews(query) {
    try {

        const response = await getJson({
            api_key: serpApiKey,
            engine: "google",
            q: JSON.parse(query).query,
            location: "France",
            google_domain: "google.fr",
            gl: "fr",
            hl: "fr",
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
            query: { type: 'string' },
        },
        },
    },
}

module.exports = getGoogleNewsTool;