import config from '../config';

const apiKey =
  config.googleSearch.apiKey || process.env.GOOGLE_SEARCH_API_KEY || '';
const cx = config.googleSearch.cx || process.env.GOOGLE_SEARCH_CX || '';
const lang = config.discord.lang;

const getGoogleSearch = async (query: string) => {
  const jsonQuery = JSON.parse(query);
  const url: string =
    'https://customsearch.googleapis.com/customsearch/v1?c2coff=1&cr=country' +
    lang.toUpperCase() +
    '&hl=' +
    lang.toLowerCase() +
    '&lr=lang_' +
    lang.toLowerCase() +
    '&num=10&safe=active' +
    '&q=' +
    encodeURIComponent(jsonQuery.search) +
    '&cx=' +
    cx +
    '&key=' +
    apiKey;
  try {
    const response = await fetch(url);

    const resultJSON = await response.json();
    console.log(resultJSON);
    return resultJSON;
  }
  catch (e) {
    console.log('err getGoogleSearch', e);
  }
};

const getGoogleSearchTool = {
  type: 'function',
  function: {
    function: getGoogleSearch,
    description:
      'Use this tool only when you need to make a search on the web. Then interpret the results and provide a summary.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string' }
      }
    }
  }
};

export default getGoogleSearchTool;
