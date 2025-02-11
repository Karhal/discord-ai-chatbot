import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

export default class DuneTool extends AbstractTool {
  readonly toolName = 'dune';
  duneApiKey = ConfigManager.config.dune.apiKey;
  public isActivated = ConfigManager.config.dune.active;

  readonly description =
    'Use this tool to query the Dune Analytics API, a resource for accessing and analyzing blockchain data. \
    When analyzing the data: \
    1. Start with the initial query, sorted by the most recent data first using orderBy \
    2. Identify key patterns or anomalies in the initial results \
    3. Determine which additional queries would provide valuable context or validation \
    4. Cross-reference data between multiple queries when relevant \
    5. Look for correlations and causal relationships \
    6. Compare current trends with historical patterns \
    In your response: \
    - Include specific numbers and percentages \
    - Highlight significant changes or patterns \
    - Provide context for the numbers \
    - Calculate relevant ratios or growth rates \
    - Draw meaningful conclusions based on the cross-referenced data \
    - Suggest potential implications or future trends \
    - Note any limitations in the data analysis \
    Format your response with: \
    1. Key Findings: Top insights from the data \
    2. Detailed Analysis: In-depth examination of patterns and relationships \
    3. Supporting Data: Relevant numbers and calculations \
    4. Recommendations: Actionable insights based on the analysis.';

  readonly parameters = {
    type: 'object',
    properties: {
      queryId: {
        type: 'string',
        description:
          'The queryId you want to get the results for. Take one from this list : \
          - 2180075 (weekly DEX market share, order by _col1) on Ethereum, \
          - 4323    (weekly DEX volume, order by _col1) on Ethereum \
          - 1933035 (Total ETH Staked, no order) \
          - 651474 (Number of active addresses on ETH, no order) \
          - 4582719 (Number of a daily new addresses on Base, order by time_) \
          - 1193168 (ETH daily transactions, order by dt) \
          - 3219693 (Solana daily transactions, order by day) \
          - 4275599 (Daily Unique Transactions on Ethereum L2 Blockchains, order by tx_date) \
          - 1188618 (Longs VS Shorts on DEXs, order by time_day) \
          '
      },
      orderBy: {
        type: 'string',
        description: 'The order by parameter to sort the results. it depends on the queryId. \
        Here are the parameter value for each queryId: \
        - 2180075: _col1 \
        - 4323: _col1 \
        - 1933035: null \
        - 651474: null \
        - 4582719: time_ \
        - 1193168: dt \
        - 3219693: day \
        - 4275599: tx_date \
        - 1188618: time_day \
        ',
        default: ''
      }
    }
  };

  readonly execute = async (args: string) => {
    const query = JSON.parse(args).queryId;
    const orderBy = JSON.parse(args).orderBy;
    const myHeaders = new Headers();
    myHeaders.append('X-Dune-API-Key', this.duneApiKey);
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    try {
      const orderByParam = orderBy ? `&sort_by=${orderBy}%20desc` : '';
      const response = await fetch(
        `https://api.dune.com/api/v1/query/${query}/results/csv?limit=50${orderByParam}`,
        requestOptions
      );
      const result = await response.text();
      return result;
    }
    catch (error) {
      console.error(error);
    }
  };
}
