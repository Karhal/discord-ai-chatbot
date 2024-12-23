import { YoutubeTranscript } from 'youtube-transcript';
import AbstractTool from './absract-tool';
import ConfigManager from '../configManager';

export default class YoutubeTranscriptTool extends AbstractTool {
  readonly toolName = 'youtube-transcript';
  readonly isActivated = ConfigManager.config.youtubeTranscript.active;

  readonly description =
    'Use this tool only when the user asks for a summary of a youtube video. \
    You are an expert analyst tasked with providing a comprehensive analysis of the above video transcript.\
    Your analysis should be based solely on the content presented in the transcript, without adding personal \
    interpretations.\n\n \
    Instructions:\n\n1. Carefully read and analyze the transcript, focusing on key topics, \
    data, trends, historical information, correlations, \turning points, important levels,\
    and any anomalies or exceptions.\n\n2. In your analysis, consider the following aspects:\n  \
    - Major topics or subjects discussed\n   - Data, statistics, or figures presented\n \
    - Short-term and long-term trends or patterns\n   - Historical information \
    and recent developments\n  - Correlations between different factors\n\
    - Potential turning points or significant changes\n\
    - Important levels, thresholds, or benchmarks\n\
    - Any anomalies, exceptions, or unusual observations\n\n\
    3. Before writing your final report, wrap your detailed breakdown inside <detailed_breakdown> tags. \
    This should include:\n  - List of major topics\n - Key statements related to each aspect mentioned above,\
     with relevant quotes from the transcript\n - Tools, methods, or indicators mentioned\n \
     - Key predictions or explanations of trends\n   - Overall sentiment for each major topic\n   \
    - Any contradictions or uncertainties\n   - Timeline of key events or developments\n   \
    - Potential biases or limitations in the information presented\n\n\
    4. Based on your analysis, prepare a concise yet comprehensive report that includes:\n  \
    - Summaries of key points for each major topic\n   - Current situation update on the focus topic\n   \
    - Brief forecast or implications for the future\n   - Timeline of key events\n   \
    - Potential biases or limitations in the information\n\n5. Important reminders:\n  \
    - Use only information and insights directly from the transcript\n  \
    - Do not add your own interpretations beyond what\'s presented\n  \
    - Maintain objectivity and accuracy in reporting the content\n   \
    - Adhere to best practices in analysis as presented in the video\n\n\
    6. Format your response as a continuous text without using any tags or special formatting. \
    Ensure that your entire response, including the detailed breakdown and final report, \
    is less than 2000 characters.\n\n Please proceed with your analysis and report based on these instructions.';

  readonly parameters = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL of the youtube video'
      }
    }
  };

  readonly execute = async (query: string) => {
    const queryParameters = JSON.parse(query);

    try {
      const transcript = await YoutubeTranscript.fetchTranscript(queryParameters.url);
      const formattedTranscript = transcript
        .map(entry => `${entry.text}`)
        .join(' ');

      return { success: true, response: formattedTranscript };
    } catch (error) {
      return {
        success: false,
        response: `Failed to fetch transcript: ${error.message}`
      };
    }
  };
}