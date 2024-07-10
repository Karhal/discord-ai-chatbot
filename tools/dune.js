const fetch = require('node-fetch');
const { duneApiKey } = require('../config.json');

async function fetchDuneData(queryId) {

    const query = JSON.parse(queryId).queryId;
    const myHeaders = new fetch.Headers();
    myHeaders.append("X-Dune-API-Key", duneApiKey);
    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try {
        const response = await fetch(`https://api.dune.com/api/v1/query/${query}/results?limit=1`, requestOptions);
        const result = await response.text();
        return result;
    } catch (error) {
        console.error(error);
    }
}

const fetchDuneDataTool = 
{
    type: 'function',
    function: {
        function: fetchDuneData,
        description: "use this tool only when asked to get data from Dune API",
        parameters: {
        type: 'object',
        properties: {
            queryId: { type: 'string' },
        },
        },
    },
}

module.exports = fetchDuneDataTool;