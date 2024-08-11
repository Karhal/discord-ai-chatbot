import ConfigManager from '../configManager';
import { getJson } from 'serpapi';

const serpApiKey = ConfigManager.getConfig().serp.apiKey;
const serpHl = ConfigManager.getConfig().serp.hl;
const serpGl = ConfigManager.getConfig().serp.gl;

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

const getMapsSearch = async (
  query: string,
  city: string
): Promise<LocalResults> => {
  const searchParams: SearchParams = {
    engine: 'google_local',
    q: query,
    location: city,
    api_key: serpApiKey,
    hl: serpHl,
    gl: serpGl
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

const getMapsSearchTool = {
  type: 'function',
  function: {
    function: getMapsSearch,
    description:
      'Use this tool only when the user asks for location information, such as a list of restaurants or other points of interest. \
      Select the 3 firsts locations returned by the tool. It is important to give minimum 3 locations. \
      Present the most exhaustive answer possible, including the information returned by the tool. \
      Beeware the size of the answer, it should not exceed 1500 characters. \
      Format your answer in one single content string, use the following format:\
      1. ** ⭐⭐⭐⭐ Place Name 1** - [Address of Place 1] - [Description of Place 1] \
      2. ** ⭐⭐⭐ Place Name 2** - [Address of Place 2] - [Description of Place 2], etc',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        city: { type: 'string' }
      }
    }
  }
};

export default getMapsSearchTool;
