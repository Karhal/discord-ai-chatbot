
const { coinApiKey, defaultAsset } = require('../config.json');
const fetch = require('node-fetch');

async function getCryptoPrice(query) {

    const queryParameters = JSON.parse(query);
    console.log(queryParameters);
    const myHeaders = new Headers();
    myHeaders.append("Accept", "text/plain");
    myHeaders.append("X-CoinAPI-Key", coinApiKey);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    let result = await fetch(`https://rest.coinapi.io/v1/exchangerate/${queryParameters.asset}/${defaultAsset}`, requestOptions);
    result = await result.text();
console.log(result);
    return result;
    }

const getCryptoPriceTool = 
{
    type: 'function',
    function: {
        function: getCryptoPrice,
        description: "use this tool when you need to get the price of an asset",
        parameters: {
        type: 'object',
        properties: {
            asset: { type: 'string' }
        },
        },
    },
}

module.exports = getCryptoPriceTool;