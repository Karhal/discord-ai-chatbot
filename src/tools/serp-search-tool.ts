import { getJson } from 'serpapi';
import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

export default class SerpSearchTool extends AbstractTool {
  readonly toolName = SerpSearchTool.name;
  public readonly isActivated = ConfigManager.config.serp.active;

  public readonly description =
    'Use this tool only when you need to get fresh news from Google. Then interpret the results and provide a summary.';

  public readonly parameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search you want to get the results for.'
      }
    }
  };

  public readonly execute = async (query: string) => {
    try {
      const queryParameters = JSON.parse(query);

      const response = await getJson({
        api_key: ConfigManager.config.serp.apiKey,
        engine: 'google',
        q: queryParameters.query,
        google_domain: ConfigManager.config.serp.google_domain,
        gl: ConfigManager.config.discord.lang,
        hl: ConfigManager.config.discord.lang,
        tbm: 'nws'
      });

      console.log(response);
      return response;
    }
    catch (error) {
      console.error(error);
    }
  };
}
