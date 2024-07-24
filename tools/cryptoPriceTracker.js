import config from '../config.js';
import fetch from 'node-fetch';

const coinApiKey = process.env.COIN_API_KEY || config.coinApiKey;
const defaultAsset = process.env.DEFAULT_ASSET || config.defaultAsset;

const getCryptoPrice = async (query) => {

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
};

const getCryptoPriceTool = 
{
    type: 'function',
    function: {
        function: getCryptoPrice,
        description: "use this tool only when you need to get the price of an asset. Use short ticker like BTC, ETH, etc.",
        parameters: {
        type: 'object',
        properties: {
            asset: { type: 'string' }
        },
        },
    },
};

export default getCryptoPriceTool;