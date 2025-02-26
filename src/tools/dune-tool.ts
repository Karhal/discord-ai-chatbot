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
    - Do NOT invent any data, only use the data provided by the queries \
    - Include specific numbers and percentages \
    - Highlight significant changes or patterns \
    - Calculate relevant ratios or growth rates \
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
          - 1933035 (Total ETH Staked, no order) \
          - 651474 (Number of active addresses on ETH, no order) \
          - 4582719 (Number of a daily new addresses on Base, order by time_) \
          - 1193168 (ETH daily transactions, order by dt) \
          - 3219693 (Solana daily transactions, order by day) \
          - 4275599 (Daily Unique Transactions on Ethereum L2 Blockchains, order by tx_date) \
          - 2822170 (GMX Open Interest (V1 + V2), BTC OI, ETH OI, UNI OI, AVAX OI, LTC OI, XRP OI, ARB OI, DOGE OI, LINK OI, SOL OI, Open Interest, Daily Change, Weekly Change, Monthly Change, GMX Longs VS Shorts Open Interest, Long Open Interest, Short Open Interest, GMX V1 Open Interest, GMX V2 Open Interest, GMX Open Interest, Long Dominance, GMX Longs VS Shorts Weighting, Markets Skewness, Lineage, order by time) \
          - 2743884 (GMX V2 GMX V2 Volume, 24H Unique Users, Weekly Unique Users, Monthly Unique Users, Unique Users, Total Users, 24H Volume, Weekly Volume, Monthly Volume, 24H Fees, Weekly Fees, Monthly Fees, Total Liquidations, GMX V2 Fees, Total Volume, Total Fees, Unique Users, Lineage, order by block_date) \
          - 2827533 (GMX V2 Chain Volume Breakdown, Version Volume Comparison, Version Fees Comparison, Fees Breakdown, Version Volume Weighting, Version User Comparison, Volume Breakdown, Chain Users Breakdown, Chain Fees Breakdown, 24H Volume, Weekly Volume, Monthly Volume, 24H Fees, Weekly Fees, Monthly Fees, Total Fees, Total Volume, Total Users, 24H Users, Weekly Users, Monthly Users, User Breakdown, Weekly Arbitrum V1 Fees, Weekly Arbitrum V2 Fees, order by block_date) \
          - 2831076 (GMX V1+V2 Total Value Locked, Daily Change, Weekly Change, Monthly Change, TVL, Lineage , day ) \
          - 4208557 (Ethereum ETFs, in $, order by time) \
          - 3953621 (Ethereum ETFs recent flows in ETH, order by block_time_est) \
          '
      },
      orderBy: {
        type: 'string',
        description: 'The order by parameter to sort the results. it depends on the queryId. \
        Here are the parameter value for each queryId: \
        - 1933035: null \
        - 651474: null \
        - 4582719: time_ \
        - 1193168: dt \
        - 3219693: day \
        - 4275599: tx_date \
        - 2822170: time \
        - 2743884: block_date \
        - 2827533: block_date \
        - 2831076: day \
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
        `https://api.dune.com/api/v1/query/${query}/results?limit=5${orderByParam}`,
        requestOptions
      );
      const result = await response.json();
      const resultData = result.result.rows;
      console.log(resultData);
      return resultData;
    }
    catch (error) {
      console.error(error);
    }
  };
}
