import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

export default class GoogleLighthouseTool extends AbstractTool {
  readonly toolName = GoogleLighthouseTool.name;
  public isActivated = ConfigManager.config.googleLighthouse.active;

  readonly description =
    'Use this tool only when user ask for get performance of a webpage or a website. url or website must be begin with http:// or https://';

  readonly parameters = {
    type: 'object',
    properties: {
      url: { type: 'string' }
    },
    required: ['url']
  };

  readonly execute = async (query: string) => {
    const jsonQuery = JSON.parse(query);
    const reportUrl =
      'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=' +
      encodeURIComponent(jsonQuery.url) +
      '&key=' +
      ConfigManager.config.googleLighthouse.active;

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
      report = this.buildReport(resultJSON);
    } else {
      console.log('Error tools checkLighthouse', JSON.stringify(result));
    }

    return report;
  };

  private buildReport = (resultJSON: any) => {
    let report = '';
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
      detailInfos += this._addDetails('FCP', 'first-contentful-paint', lh);
      detailInfos += this._addDetails('TTI', 'interactive', lh);
      detailInfos += this._addDetails('TBT', 'total-blocking-time', lh);
      detailInfos += this._addDetails('LCP', 'largest-contentful-paint', lh);
      detailInfos += this._addDetails('FCP', 'first-contentful-paint', lh);
      detailInfos += this._addDetails('CLS', 'cumulative-layout-shift', lh);
      detailInfos += this._addDetails('Resp time', 'server-response-time', lh);
      if (detailInfos) {
        report += 'Details :\r\n' + detailInfos;
      }
    }
    return report;
  };

  private _addDetails = (title: string, key: string, lh: any) => {
    if (lh.audits['first-contentful-paint']) {
      return '\t' + title + ' : ' + JSON.stringify(lh.audits[key]) + '\r\n';
    }
    return '';
  };
}
