import { Innertube } from 'youtubei.js';
import AbstractTool from './absract-tool';
import ConfigManager from '../configManager';

export default class YoutubeTranscriptTool extends AbstractTool {
  readonly toolName = 'youtube-transcript';
  readonly isActivated = ConfigManager.config.youtubeTranscript.active;

  readonly description =
    'Use this tool when the user questions you about a youtube video. \
    The tool will provide you the transcript of the video. \
    Your goal is to provide a concise, insightful analysis of the transcript\'s content. \
    Follow these steps:\
    1. Read the transcript.\
    1b. Ignore all marketing and promotional content.\
    2. Identify the main topics discussed\
      - For each topic:\
      - List key points\
      - Consider potential implications or forecasts based on the content\
      - Identify any potential biases or limitations in the content\
    3. Based on your analysis, create a final report that:\
      - Summarizes key points for each major topic\
      - Includes a brief forecast or implications\
      - Addresses potential biases or limitations\
      - Suggests areas for further inquiry based on your brainstormed questions\
      - Is formatted as continuous text without tags\
      - Is less than 2000 characters in length.';

  readonly parameters = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL of the youtube video'
      }
    }
  };

  private youtube: Innertube | null = null;

  private async initYoutube() {
    if (!this.youtube) {
      this.youtube = await Innertube.create({
        lang: 'en',
        location: 'US',
        retrieve_player: false,
      });
    }
    return this.youtube;
  }

  private extractVideoId(url: string): string {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    if (!match) throw new Error('Invalid YouTube URL');
    return match[1];
  }

  readonly execute = async (query: string) => {
    console.log('Starting execute with query:', query);
    const queryParameters = JSON.parse(query);
    console.log('Parsed parameters:', queryParameters);

    try {
      console.log('Initializing Youtube...');
      const youtube = await this.initYoutube();
      console.log('Youtube initialized');

      const videoId = this.extractVideoId(queryParameters.url);
      console.log('Extracted video ID:', videoId);

      console.log('Fetching video info for ID:', videoId);
      const info = await youtube.getInfo(videoId);
      console.log('Video info fetched');

      console.log('Fetching transcript...');
      const transcriptData = await info.getTranscript();
      console.log('Transcript data:', transcriptData);

      const formattedTranscript = transcriptData.transcript.content.body.initial_segments
        .map(segment => segment.snippet.text)
        .join(' ');

      return { success: true, response: formattedTranscript };
    } catch (error) {
      console.error('Error details:', error);
      return {
        success: false,
        response: `Failed to fetch transcript: ${error.message}`
      };
    }
  };
}