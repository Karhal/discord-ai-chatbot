import config from '../config';

const coinApiKey = config.coin.apiKey || process.env.COIN_API_KEY || '';
const defaultAsset =
  config.coin.defaultAsset || process.env.DEFAULT_ASSET || '';

const getCryptoPrice = async (query: string) => {
  const queryParameters = JSON.parse(query);
  console.log(queryParameters);
  const myHeaders = new Headers();
  myHeaders.append('Accept', 'text/plain');
  myHeaders.append('X-CoinAPI-Key', coinApiKey);

  const requestOptions: RequestInit = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  const result = await fetch(
    `https://rest.coinapi.io/v1/exchangerate/${queryParameters.asset}/${defaultAsset}`,
    requestOptions
  );
  const resultJSON = await result.text();
  console.log(resultJSON);
  return resultJSON;
};

const getCryptoPriceTool = {
  type: 'function',
  function: {
    function: getCryptoPrice,
    name: 'getCryptoPrice',
    description:
      'use this tool only when you need to get the price of an asset. Use short ticker like BTC, ETH, etc.',
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string' }
      }
    }
  }
};

export default getCryptoPriceTool;
