import ConfigManager from '../configManager';
import { getJson } from 'serpapi';
import AbstractTool from './absract-tool';

interface SearchParams {
  engine: string;
  q: string;
  location: string;
  api_key: string;
  hl: string;
  gl: string;
}

interface LocalResults {
  local_results: [];
}

export default class MapSearchTool extends AbstractTool {
  readonly toolName = 'map-search';
  public readonly isActivated = ConfigManager.config.serp.active;

  public readonly description =
    'Use this tool only when the user asks for location information, such as a list of restaurants or other points of interest. \
      Select the 3 firsts locations returned by the tool. It is important to give minimum 3 locations. \
      Present the most exhaustive answer possible, including the information returned by the tool. \
      Beeware the size of the answer, it should not exceed 1500 characters. \
      Format your answer in one single content string, use the following format:\
      1. ** ⭐⭐⭐⭐ Place Name 1** - [Address of Place 1] - [Description of Place 1] \
      2. ** ⭐⭐⭐ Place Name 2** - [Address of Place 2] - [Description of Place 2], etc';

  public readonly parameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search you want to get the results for.'
      },
      city: {
        type: 'string',
        description: 'The city you want to get the results for.'
      }
    }
  };

  public readonly execute = async (
    query: string,
    city: string
  ): Promise<LocalResults> => {
    const searchParams: SearchParams = {
      engine: 'google_local',
      q: query,
      location: city,
      api_key: ConfigManager.config.serp.apiKey,
      hl: ConfigManager.config.serp.hl,
      gl: ConfigManager.config.serp.gl
    };

    try {
      const json = await getJson(searchParams);
      console.log('Maps search results:', json);
      return json['local_results'];
    }
    catch (error) {
      console.error('Error fetching maps search results:', error);
      throw new Error('Failed to fetch maps search results');
    }
  };
}
