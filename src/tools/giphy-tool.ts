import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

export default class GiphyTool extends AbstractTool {
  readonly toolName = GiphyTool.name;
  giphyApiKey = ConfigManager.config.giphy.apiKey;
  public isActivated = ConfigManager.config.giphy.active;

  readonly description =
    'Use this tool randomly when you, as an assistant, you want to attach a gif to your answer,\
    include the returned url in your final response. The url must be clear and entoured by spaces';

  readonly parameters = {
    type: 'object',
    properties: {
      keyword: {
        type: 'string',
        description: 'The keyword you want to get the results for.'
      }
    }
  };

  readonly execute = async (query: string) => {
    const tag = JSON.parse(query).keyword;
    const url = new URL('https://api.giphy.com/v1/gifs/random');
    url.searchParams.append('api_key', this.giphyApiKey);
    url.searchParams.append('tag', tag);
    const requestOptions: RequestInit = {
      method: 'GET',
      redirect: 'follow'
    };

    try {
      const response = await fetch(url.toString(), requestOptions);
      const result = await response.json();
      console.log(JSON.stringify({ gif_url: result.data.embed_url }));
      return JSON.stringify({ gif_url: result.data.embed_url });
    }
    catch (error) {
      console.error(error);
    }
  };
}
