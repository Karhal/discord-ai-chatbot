import { FormData } from 'formdata-node';
import ImageHandler from '../handlers/image-handler';
import AbstractTool from './absract-tool';
import ConfigManager from '../configManager';

export default class StableDiffusionTool extends AbstractTool {
  readonly toolName = StableDiffusionTool.name;
  public isActivated = ConfigManager.config.stability.active;
  private stabilityConfig = ConfigManager.config.stability;
  private apiKey: string;

  constructor() {
    super();
    this.apiKey = this.stabilityConfig.apiKey;
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

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'webp');
    try {
      const response = await fetch(
        'https://api.stability.ai/v2beta/stable-image/generate/ultra',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'image/*'
          },
          body: formData
        }
      );

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
      }
      else {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
    }
    catch (error) {
      console.error('Error generating image:', error);
      return 'Error generating image';
    }
  };

  readonly execute = async (promptAsString: string) => {
    try {
      const prompt = JSON.parse(promptAsString);
      const imageHandler = new ImageHandler();

      const imageBuffer = await this.generateImage(prompt.imagePrompt);
      if (imageBuffer) {
        await imageHandler.saveBase64Image(imageBuffer, 'webp');
      }
      return JSON.stringify({ image_ready: true });
    }
    catch (error: unknown) {
      console.error(error);
      return JSON.stringify({ error: 'An unexpected error occurred' });
    }
  };
}