import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

export default class DuneTool extends AbstractTool {
  readonly toolName = 'dune';
  duneApiKey = ConfigManager.config.dune.apiKey;
  public isActivated = ConfigManager.config.dune.active;

  readonly description =
    'Use this tool only when you need to make a search on the web. Then interpret the results and provide a summary.';

  readonly parameters = {
    type: 'object',
    properties: {
      queryId: {
        type: 'string',
        description:
          'The queryId you want to get the results for. Use the queryId from the dune search results.'
      }
    }
  };

  readonly execute = async (queryId: string) => {
    const query = JSON.parse(queryId).queryId;
    const myHeaders = new Headers();
    myHeaders.append('X-Dune-API-Key', this.duneApiKey);
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    try {
      const response = await fetch(
        `https://api.dune.com/api/v1/query/${query}/results?limit=1`,
        requestOptions
      );
      const result = await response.json();
      console.log(result);
      return result;
    }
    catch (error) {
      console.error(error);
    }
  };
}
