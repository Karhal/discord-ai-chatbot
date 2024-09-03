import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

interface GiphyResponse {
  data: {
    embed_url: string;
  };
}

interface GiphyError {
  message: string;
}

export default class GiphyTool extends AbstractTool {
  readonly toolName = GiphyTool.name;
  giphyApiKey = ConfigManager.config.giphy.apiKey;
  public isActivated = ConfigManager.config.giphy.active;

  readonly description =
    'Use this tool randomly when you, as an assistant, you want to attach a gif to your answer, \
    chose an appropriate tag relative to the conversation\
    include the returned url in your final response. The url must be clear and entoured by spaces. \
    Do not make comment about the gif, just send the link.';

  readonly parameters = {
    type: 'object',
    properties: {
      keyword: {
        type: 'string',
        description: 'The keyword you want to get the gif for.'
      }
    }
  };

  readonly execute = async (query: string): Promise<string | void> => {
    const tag = JSON.parse(query).keyword;
    try {
      const gifUrl = await this.fetchGif(tag);
      console.log('########');
      console.log('tag', tag);
      console.log(JSON.stringify({ gif_url: gifUrl }));
      return JSON.stringify({ gif_url: gifUrl });
    }
    catch (error) {
      console.error((error as GiphyError).message);
    }
  };

  private async fetchGif(tag: string): Promise<string> {
    const url = new URL('https://api.giphy.com/v1/gifs/random');
    url.searchParams.append('api_key', this.giphyApiKey);
    url.searchParams.append('tag', tag);

    const requestOptions: RequestInit = {
      method: 'GET',
      redirect: 'follow'
    };

    const response = await fetch(url.toString(), requestOptions);
    if (!response.ok) {
      throw new Error('Failed to fetch GIF');
    }
    const result: GiphyResponse = await response.json();
    return result.data.embed_url;
  }
}