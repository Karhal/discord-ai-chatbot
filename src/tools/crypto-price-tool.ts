import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

export default class CryptoPriceTool extends AbstractTool {
  readonly toolName = CryptoPriceTool.name;
  private defaultAsset = ConfigManager.config.coin.defaultAsset;
  readonly isActivated = ConfigManager.config.coin.active;

  readonly description =
    'use this tool only when you need to get the price of an asset. Use short ticker like BTC, ETH, etc.';

  readonly parameters = {
    type: 'object',
    properties: {
      asset: {
        type: 'string',
        description:
          'The asset you want to get the price for. Use short ticker like BTC, ETH, etc.'
      }
    }
  };

  readonly execute = async (query: string) => {
    const queryParameters = JSON.parse(query);
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'text/plain');
    myHeaders.append('X-CoinAPI-Key', ConfigManager.config.coin.apiKey);

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    const result = await fetch(
      `https://rest.coinapi.io/v1/exchangerate/${queryParameters.asset}/${this.defaultAsset}`,
      requestOptions
    );
    const resultJSON = await result.text();
    console.log(resultJSON);

    return JSON.parse(resultJSON);
  };
}
