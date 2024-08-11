import ConfigManager from '../configManager';

const getBraveSearch = async (query: string) => {
  const braveSearchApiKey = ConfigManager.config.braveSearch.apiKey;
  const lang = ConfigManager.config.discord.lang;
  const queryParameters = JSON.parse(query);
  const myHeaders = new Headers();
  myHeaders.append('Accept', 'application/json');
  myHeaders.append('Accept-Encoding', 'gzip');
  myHeaders.append('X-Subscription-Token', braveSearchApiKey);

  const requestOptions: RequestInit = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${queryParameters.query}&search_lang=${lang}&count=5&result_filter=news,web`,
    requestOptions
  );
  const resultJSON = await response.json();

  console.log({ news: resultJSON.news, web_search: resultJSON.web });
  return { news: resultJSON.news, web_search: resultJSON.web };
};

const getBraveSearchTool = {
  type: 'function',
  function: {
    function: getBraveSearch,
    description:
      'Use this tool only when you need to make a search on the web. Then interpret the results and provide a summary.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' }
      }
    }
  }
};

export default getBraveSearchTool;
