import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

export default class BraveSearchTool extends AbstractTool {
  readonly toolName = BraveSearchTool.name;
  readonly isActivated = ConfigManager.config.braveSearch.active;

  readonly description =
    'Use this tool only when you need to make a search on the web. Then interpret the results and provide a summary.';

  readonly parameters = {
    type: 'object',
    properties: {
      query: { type: 'string' }
    }
  };

  readonly execute = async (query: string) => {
    const lang = ConfigManager.config.discord.lang;
    const queryParameters = JSON.parse(query).query;
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    myHeaders.append('Accept-Encoding', 'gzip');
    myHeaders.append(
      'X-Subscription-Token',
      ConfigManager.config.braveSearch.apiKey
    );

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${queryParameters}&search_lang=${lang}&count=5&result_filter=news,web`,
      requestOptions
    );
    const resultJSON = await response.json();

    console.log({ news: resultJSON.news, web_search: resultJSON.web });
    return { news: resultJSON.news, web_search: resultJSON.web };
  };
}