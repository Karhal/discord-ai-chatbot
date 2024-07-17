import config from '../config.json' assert { type: 'json' };

const serpApiKey = process.env.SERP_API_KEY || config.serpApiKey;
const lang = process.env.LANG || config.lang;
const serpGoogle_domain = process.env.SERP_GOOGLE_DOMAIN || config.serpGoogle_domain;

const getGoogleNews = async (query) => {
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
        });

        console.log(response);
        return response;
    } catch (error) {
        console.error(error);
    }
};

const getGoogleNewsTool = {
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
};

export default getGoogleNewsTool;