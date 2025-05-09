import { FormData } from 'formdata-node';
import ImageHandler from '../handlers/image-handler';
import AbstractTool from './absract-tool';
import ConfigManager from '../configManager';

export default class StableDiffusionTool extends AbstractTool {
  readonly toolName = 'stable-diffusion';
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
          The prompt Must be written in english. \
          A good prompt for Stable Diffusion should be detailed and specific, \
          covering various keyword categories such as subject, medium, style, and more. \
          The subject category should include clear descriptions of the desired image, \
          specifying elements like appearance, pose, and background. \
          Example of a good prompt: "A beautiful and powerful mysterious sorceress, \
          smiling, sitting on a rock, casting lightning magic, wearing a detailed leather outfit with gemstones, \
          a hat, and in a castle background. The image should be in digital art style, hyper-realistic, \
          fantasy, and dark art, similar to what you\'d find on Artstation. \
          It should have high detail and sharp focus, with a touch of sci-fi and dystopian elements.\
           The overall color scheme should include iridescent gold, and the lighting should resemble studio lighting."'
      }
    }
  };

  async generateImage(prompt: string): Promise<string | null> {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'webp');
    try {
      const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/ultra', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'image/*'
        },
        body: formData
      });

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
  }

  readonly execute = async (promptAsString: string) => {
    try {
      const prompt = JSON.parse(promptAsString);
      const imageHandler = new ImageHandler();

      // Extract channelId from the prompt if available
      const channelId = prompt.channelId;

      const imageBuffer = await this.generateImage(prompt.imagePrompt);
      if (imageBuffer) {
        await imageHandler.saveBase64Image(imageBuffer, 'webp', channelId);
      }
      return JSON.stringify({ image_ready: true, info: 'Image generated and saved will be send as attachement' });
    }
    catch (error: unknown) {
      console.error(error);
      return JSON.stringify({ error: 'An unexpected error occurred' });
    }
  };
}
