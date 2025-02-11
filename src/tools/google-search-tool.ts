import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

export default class GoogleSearchTool extends AbstractTool {
  readonly toolName = 'google-search';
  public isActivated = ConfigManager.config.googleSearch.active;
  private apiKey = ConfigManager.config.googleSearch.apiKey;
  private cx = ConfigManager.config.googleSearch.cx;
  private lang = ConfigManager.config.discord.lang;

  public readonly description =
    'Use this tool only when you need to make a search on the web. \
    For example, if the user talks about a subject you do not know, use this tool to search the web for information about the subject. \
    Then interpret the results and provide a short summary';

  public readonly parameters = {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'The search you want to get the results for.'
      }
    }
  };

  public readonly execute = async (query: string) => {
    const jsonQuery = JSON.parse(query);
    const url: string =
      'https://customsearch.googleapis.com/customsearch/v1?c2coff=1&cr=country' +
      this.lang.toUpperCase() +
      '&hl=' +
      this.lang.toLowerCase() +
      '&lr=lang_' +
      this.lang.toLowerCase() +
      '&num=10&safe=active' +
      '&q=' +
      encodeURIComponent(jsonQuery.search) +
      '&cx=' +
      this.cx +
      '&key=' +
      this.apiKey;
    try {
      const response = await fetch(url);

      const resultJSON = await response.json();
      return resultJSON;
    }
    catch (e) {
      console.log('err getGoogleSearch', e);
    }
  };
}
