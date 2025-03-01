import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';
import ImageHandler from '../handlers/image-handler';
import ClaudeClient from '../clients/ai-clients/claude-client';

// Define indicator interfaces for type safety
interface IndicatorInput {
  [key: string]: string | number | boolean;
}

interface IndicatorOverride {
  [key: string]: string | number | boolean;
}

interface StudyIndicator {
  name: string;
  input?: IndicatorInput;
  override?: IndicatorOverride;
}

export default class TradingChartTool extends AbstractTool {
  readonly toolName = 'trading-chart';
  readonly isActivated = true;
  tradingChartConfig = ConfigManager.config.tradingChart;
  anthropicConfig = ConfigManager.config.claude;
  readonly description =
    'Call this tool to get a chart of a requested stock with customizable indicators. Use it when the user asks for a chart of a stock or an analysis of a token price.';

  // Pre-defined indicator configurations
  readonly indicatorPresets: Record<string, StudyIndicator> = {
    'SMA9': {
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
    'SMA18': {
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
    'MACD': {
      name: 'MACD',
      override: {
        'Signal.linewidth': 2,
        'Signal.color': 'rgb(255,65,129)'
      }
    },
    'BollingerBands': {
      name: 'Bollinger Bands',
      input: {
        in_0: 20,
        in_1: 2
      },
      override: {
        'Median.visible': true,
        'Median.linewidth': 1,
        'Median.plottype': 'line',
        'Median.color': 'rgb(255,109,0)',
        'Upper.visible': true,
        'Upper.linewidth': 1,
        'Upper.plottype': 'line',
        'Upper.color': 'rgb(33,150,243)',
        'Lower.visible': true,
        'Lower.linewidth': 1,
        'Lower.plottype': 'line',
        'Lower.color': 'rgb(33,150,243)',
        'Plots Background.visible': true,
        'Plots Background.color': 'rgba(33,150,243,0.1)'
      }
    },
    'DoubleEMA': {
      name: 'Double EMA',
      input: {
        in_0: 9
      },
      override: {
        'Plot.linewidth': 1,
        'Plot.plottype': 'line',
        'Plot.color': 'rgb(67,160,71)'
      }
    },
    'RSI': {
      name: 'Relative Strength Index',
      input: {
        length: 14,
        source: 'close'
      },
      override: {
        'Plot.linewidth': 1,
        'Plot.plottype': 'line',
        'Plot.color': 'rgb(242,54,69)'
      }
    }
  };

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
      },
      indicators: {
        type: 'array',
        description: 'Array of indicators to use (exactly 1 or 2 indicators required). Can be either indicator names from presets (e.g., "MACD", "BollingerBands", "SMA9") or custom indicator objects.',
        items: {
          anyOf: [
            {
              type: 'string',
              description: 'Name of predefined indicator (MACD, BollingerBands, SMA9, SMA18, DoubleEMA, RSI)'
            },
            {
              type: 'object',
              description: 'Custom indicator configuration',
              properties: {
                name: {
                  type: 'string',
                  description: 'Indicator name (e.g., "Moving Average", "MACD", "Bollinger Bands")'
                },
                input: {
                  type: 'object',
                  description: 'Indicator input parameters'
                },
                override: {
                  type: 'object',
                  description: 'Indicator visualization overrides'
                }
              },
              required: ['name']
            }
          ]
        },
        maxItems: 2,
        minItems: 1
      }
    },
    required: ['symbol', 'indicators']
  };

  readonly execute = async (query: string) => {
    const queryParameters = JSON.parse(query);

    // Process indicators
    let studies: StudyIndicator[] = [];

    if (Array.isArray(queryParameters.indicators)) {
      // Limit to maximum 2 indicators
      const limitedIndicators = queryParameters.indicators.slice(0, 2);

      if (queryParameters.indicators.length > 2) {
        console.warn(`Too many indicators provided (${queryParameters.indicators.length}). Only the first 2 will be used.`);
      }

      studies = limitedIndicators.map((indicator: string | StudyIndicator) => {
        // If indicator is a string, look it up in presets
        if (typeof indicator === 'string') {
          if (this.indicatorPresets[indicator]) {
            return this.indicatorPresets[indicator];
          }
          else {
            console.warn(`Unknown indicator preset: ${indicator}. Using MACD as fallback.`);
            return this.indicatorPresets['MACD'];
          }
        }
        // If indicator is already an object, use it directly
        else if (typeof indicator === 'object' && indicator.name) {
          return indicator;
        }
        // Fallback for invalid formats
        else {
          console.warn('Invalid indicator format. Using MACD as fallback.');
          return this.indicatorPresets['MACD'];
        }
      });
    }
    else {
      // If indicators parameter is missing or not an array, throw an error
      throw new Error('The "indicators" parameter is required and must be an array containing 1 or 2 indicators');
    }

    const requestBody = {
      theme: 'dark',
      interval: queryParameters.interval || '4h',
      symbol: queryParameters.symbol,
      override: {
        showStudyLastValue: false
      },
      studies: studies
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

    // Customize prompt based on the indicators being used
    const indicatorNames = studies.map(study => study.name);
    const analysisPoints = [
      '1. **Candlestick Analysis**:\\',
      '- Identify and explain any significant candlestick patterns (e.g., bullish engulfing, doji, hammer).\\',
      '- Comment on the overall trend (bullish, bearish, or sideways).\\',
      '- Highlight any breakout or pullback zones.\\'
    ];

    // Add indicator-specific analysis points
    if (indicatorNames.some(name => name === 'MACD')) {
      analysisPoints.push(
        '2. **MACD Analysis**:\\',
        '- Describe the current state of the MACD line and Signal line (e.g., bullish crossover, bearish crossover).\\',
        '- Discuss the MACD histogram and its implications for momentum.\\',
        '- Identify any divergences between the MACD and the price action.\\'
      );
    }

    if (indicatorNames.some(name => name === 'Moving Average')) {
      analysisPoints.push(
        '3. **Moving Average Analysis**:\\',
        '- Highlight any significant trends in the Moving Average lines.\\',
        '- Discuss crossovers and their significance.\\',
        '- Analyze how price is behaving relative to these averages.\\'
      );
    }

    if (indicatorNames.some(name => name === 'Bollinger Bands')) {
      analysisPoints.push(
        '4. **Bollinger Bands Analysis**:\\',
        '- Comment on price movement relative to the Bollinger Bands.\\',
        '- Identify any squeeze or expansion of the bands and what it indicates.\\',
        '- Point out touches or breaks of the upper/lower bands and their significance.\\'
      );
    }

    if (indicatorNames.some(name => name === 'Relative Strength Index')) {
      analysisPoints.push(
        '5. **RSI Analysis**:\\',
        '- Identify overbought or oversold conditions.\\',
        '- Look for divergences between RSI and price action.\\',
        '- Discuss the current momentum as indicated by the RSI.\\'
      );
    }

    // Add general analysis points that apply to all charts
    analysisPoints.push(
      '6. **Support and Resistance Levels**;\\',
      '- Identify key support and resistance zones based on the chart.\\',
      '- Discuss the importance of these levels for potential reversals or breakouts.\\',
      '7. **Actionable Insights**\\',
      '- Provide clear guidance on potential buy, sell, or hold strategies.\\',
      '- Suggest what to watch for in the near term, including confirmation signals or potential risks.\\',
      '8. **Other Observations**:\\',
      '- Note any patterns or indicators that are relevant to the analysis.\\',
      '- Offer insights into market sentiment or other broader trends based on the chart'
    );

    const prompt = `# Role \\
You are an expert financial analyst specializing in technical analysis of stock charts.\\
Your role is to analyze financial charts provided to you and offer comprehensive insights into the technical aspects,\\
including candlestick patterns and the following indicators: ${indicatorNames.join(', ')}.\\
You must provide a detailed breakdown of the chart, highlighting key areas of interest and actionable insights.\\
When analyzing a stock chart, always include the following:\\
${analysisPoints.join('\n')}`;

    const analysis = await claudeClient.analyzeImage(imageBase64, prompt, 'image/png');

    return {
      result: true,
      analysis: analysis
    };
  };
}