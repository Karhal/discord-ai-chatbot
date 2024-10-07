import OpenAI from 'openai';
import ImageHandler from '../handlers/image-handler';
import AbstractTool from './absract-tool';
import ConfigManager from '../configManager';

type openAIImageSize =
  | '1024x1024'
  | '256x256'
  | '512x512'
  | '1792x1024'
  | '1024x1792'
  | null
  | undefined;

export default class DallETool extends AbstractTool {
  readonly toolName = 'dalle';
  dallEConfig = ConfigManager.config.dallE;
  public isActivated = ConfigManager.config.dallE.active;
  client: OpenAI;
  private imageSize: openAIImageSize;

  constructor() {
    super();
    this.imageSize = this.dallEConfig.imageSize as openAIImageSize;
    this.client = new OpenAI({
      apiKey: this.dallEConfig.apiKey
    });
  }
  readonly description =
    'Use this tool only when the user asks you to draw or to show a picture of something in the last message. \
    The tool will generate an image based on the prompt you provide and add it as an attachment on discord.';

  readonly parameters = {
    type: 'object',
    properties: {
      imagePrompt: {
        type: 'string',
        description:
          'Prompt for the image generation. The more specific your prompt, the better the image quality. \
            Include details like the setting, objects, colors, mood, and any specific elements you want in the image. \
            Consider Perspective and Composition. Specify Lighting and Time of Day. \
            Specify Desired Styles or Themes.'
      }
    }
  };

  async generateImage(prompt: string): Promise<string | null> {
    if (!this.client) return null;

    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: this.imageSize
    });
    return response?.data[0]?.url || null;
  }

  readonly execute = async (promptAsString: string) => {
    try {
      console.log('generating image for prompt:', promptAsString);
      const prompt = JSON.parse(promptAsString);
      console.log('prompt', prompt);
      const imageHandler = new ImageHandler();

      const imgUrl = await this.generateImage(prompt.imagePrompt);
      if (imgUrl) {
        console.log('imgUrl', imgUrl);
        await imageHandler.downloadImages([imgUrl]);
      }
      else {
        console.log('No image URL generated');
      }
      return JSON.stringify({ image_ready: true });
    }
    catch (error: unknown) {
      console.log('An unexpected error occurred during generation of image');
      console.log(error);
      if (error instanceof Error && 'status' in error && error.status === 400) {
        return (error as { error?: { message?: string } }).error?.message || null;
      }
      return JSON.stringify({ error: 'An unexpected error occurred during generation of image' });
    }
  };
}
