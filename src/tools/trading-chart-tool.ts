import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';
import ImageHandler from '../handlers/image-handler';
import ClaudeClient from '../clients/ai-clients/claude-client';

export default class TradingChartTool extends AbstractTool {
  readonly toolName = 'trading-chart';
  readonly isActivated = true;
  tradingChartConfig = ConfigManager.config.tradingChart;
  anthropicConfig = ConfigManager.config.claude;
  readonly description =
    'Call this tool to get an analysis of a requested stock chart.';

  readonly parameters = {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'The trading pair to chart (e.g., "BINANCE:BTCUSDT")'
      },
      interval: {
        type: 'string',
        description: 'Chart timeframe (e.g. 4h, 6h, 12h, 1D, 1W, 1M, 3M)'
      }
    }
  };

  readonly execute = async (query: string) => {
    const queryParameters = JSON.parse(query);
    const requestBody = {
      theme: 'dark',
      interval: queryParameters.interval || '4h',
      symbol: queryParameters.symbol,
      override: {
        showStudyLastValue: false
      },
      studies: [
        {
          name: 'Moving Average',
          input: {
            length: 9,
            source: 'close',
            offset: 0,
            smoothingLine: 'SMA',
            smoothingLength: 9
          },
          override: {
            'Plot.linewidth': 1,
            'Plot.plottype': 'line',
            'Plot.color': 'rgb(255,65,129)'
          }
        },
        {
          name: 'Moving Average',
          input: {
            length: 18,
            source: 'close',
            offset: 0,
            smoothingLine: 'SMA',
            smoothingLength: 18
          },
          override: {
            'Plot.linewidth': 1,
            'Plot.plottype': 'line'
          }
        },
        {
          name: 'MACD',
          override: {
            'Signal.linewidth': 2,
            'Signal.color': 'rgb(255,65,129)'
          }
        }
      ]
    };

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'x-api-key': this.tradingChartConfig.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      redirect: 'follow'
    };

    const response = await fetch(
      'https://api.chart-img.com/v2/tradingview/advanced-chart',
      requestOptions
    );

    const imageHandler = new ImageHandler();
    const imagePath = await imageHandler.processImageResponse(response);

    if (!imagePath) {
      throw new Error('Failed to process chart image');
    }

    const imageBase64 = await imageHandler.getImageAsBase64(imagePath);
    const claudeClient = new ClaudeClient();
    const prompt = '# Role \
You are an expert financial analyst specializing in technical analysis of stock charts.\
Your role is to analyze financial charts provided to you and offer comprehensive insights into the technical aspects,\
including candlestick patterns, MACD indicators, EMA9 & EMA18 trends, and overall market sentiment.\
 You must provide a detailed breakdown of the chart, highlighting key areas of interest and actionable insights.\
When analyzing a stock chart, always include the following:\
1. **Candlestick Analysis**:\
- Identify and explain any significant candlestick patterns (e.g., bullish engulfing, doji, hammer).\
- Comment on the overall trend (bullish, bearish, or sideways).\
- Highlight any breakout or pullback zones.\
2. **MACD Analysis**:\
- Describe the current state of the MACD line and Signal line (e.g., bullish crossover, bearish crossover).\
- Discuss the MACD histogram and its implications for momentum.\
- Identify any divergences between the MACD and the price action.\
3. **EMA9 & EMA18 Analysis**:\
- Highlight any significant trends in the EMA9 (red line) and EMA18 (blue line) lines.\
- Discuss the importance of these levels for potential reversals or breakouts.\
4. **Support and Resistance Levels**;\
- Identify key support and resistance zones based on the chart.\
- Discuss the importance of these levels for potential reversals or breakouts.\
5. **Actionable Insights**\
- Provide clear guidance on potential buy, sell, or hold strategies.\
- Suggest what to watch for in the near term, including confirmation signals or potential risks.\
6. **Other Observations**:\
- Note any patterns or indicators that are relevant to the analysis.\
- Offer insights into market sentiment or other broader trends based on the chart';
    const analysis = await claudeClient.analyzeImage(imageBase64, prompt, 'image/png');

    return {
      result: true,
      analysis: analysis
    };
  };
}