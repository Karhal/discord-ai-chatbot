import ConfigManager from './../configManager';
const config = ConfigManager.getConfig();
const apiKey = config.lighthouse.apiKey;

const _addDetails = function(title: string, key: string, lh: any) {
  if (lh.audits['first-contentful-paint']) {
    return '\t' + title + ' : ' + JSON.stringify(lh.audits[key]) + '\r\n';
  }
  else {
    return '';
  }
};

const _checkLighthouse = async (query: string) => {
  const jsonQuery = JSON.parse(query);
  const reportUrl =
    'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=' +
    encodeURIComponent(jsonQuery.url) +
    '&key=' +
    apiKey;

  const fetchOtions: RequestInit = {
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }),
    cache: 'default'
  };

  let report = '';
  const result = await fetch(reportUrl, fetchOtions);
  if (result.status === 200) {
    const resultJSON = await result.json();

    let lh = resultJSON;
    if (lh.lighthouseResult) {
      lh = lh.lighthouseResult;
    }
    if (!!lh.requestedUrl && !!lh.finalUrl && lh.requestedUrl !== lh.finalUrl) {
      report += 'url redirect to the final url ' + lh.finalUrl + '\r\n';
    }
    if (lh?.categories?.performance?.score) {
      report +=
        'Performance score is ' + lh.categories.performance.score + '\r\n';
    }
    if (lh.audits) {
      let detailInfos = '';
      detailInfos += _addDetails('FCP', 'first-contentful-paint', lh);
      detailInfos += _addDetails('TTI', 'interactive', lh);
      detailInfos += _addDetails('TBT', 'total-blocking-time', lh);
      detailInfos += _addDetails('LCP', 'largest-contentful-paint', lh);
      detailInfos += _addDetails('FCP', 'first-contentful-paint', lh);
      detailInfos += _addDetails('CLS', 'cumulative-layout-shift', lh);
      detailInfos += _addDetails('Resp time', 'server-response-time', lh);
      if (detailInfos) {
        report += 'Details :\r\n' + detailInfos;
      }
    }
  }
  else {
    console.log('Error tools checkLighthouse', JSON.stringify(result));
  }

  return report;
};

const checkLighthouse = {
  type: 'function',
  function: {
    function: _checkLighthouse,
    description:
      'Use this tool only when user ask for get performance of a webpage or a website. url or website must be begin with http:// or https://',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string' }
      },
      required: ['url']
    }
  }
};

export default checkLighthouse;
