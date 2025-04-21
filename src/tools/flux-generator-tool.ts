import ImageHandler from '../handlers/image-handler';
import AbstractTool from './absract-tool';
import ConfigManager from '../configManager';
import * as fal from '@fal-ai/serverless-client';
fal.config({
  credentials: ConfigManager.config.fluxApi.apiKey
});
export default class FluxGeneratorTool extends AbstractTool {
  readonly toolName = 'flux';
  public isActivated = ConfigManager.config.fluxApi.active;

  readonly description =
    'Use this tool only when the user asks you to draw or to show a picture of something in the last message. \
    The tool will generate an image based on the prompt you provide and add it as an attachment on discord.';

  readonly parameters = {
    type: 'object',
    properties: {
      imagePrompt: {
        type: 'string',
        description:
          'Crafting the perfect image prompt requires strategic \
          layering of descriptive elements to guide the AI\'s creative process. \
          Begin by defining your core subject with exceptional precision, moving \
          beyond basic descriptions to include specific poses, actions, and contextual details that \
          breathe life into your vision. \
          Use this prompt template : A [descriptive adjectives] [subject], in a [location/environment], [actions/movements]. [Specific features of the subject]. Shot with a [lens type] lens for a [perspective/style], emphasizing [elements to highlight]. The lighting is [lighting description], creating a [atmosphere/feeling]. [additional elements/details]. \
          Examples 1 : A pale-skinned realistic young fitness model from Brazil, aged 26, wearing a vibrant yellow Western short dress, standing on a sunny Rio de Janeiro beach with the ocean in the background. She has curly brown hair, a bright smile, and a toned body. Shot with a 24–70mm f/2.8 lens for a wide-angle view, capturing the vibrant colors of the beach and her energetic pose. The lighting is natural and sunny, enhancing the tropical vibe \
          Examples 2 : A sleek, cherry-red sports car, possibly a Ferrari or Lamborghini, hurtles down a winding California coastal highway, the sun setting in a vibrant blaze of orange and gold. The gleaming chrome accents of the car reflect the golden light, and the Pacific Ocean shimmers in the distance, a deep azure under the fading daylight. The road curves through a lush landscape of palm trees and wildflowers, the scenery a blur of motion as the car accelerates. Photographed with a wide-angle lens to capture the breathtaking scope of the environment and the car\'s speed, it conveys a sense of thrilling freedom and boundless energy in a stunning California setting. The composition uses cinematic lighting, with warm, saturated colors, offering a vibrant portrayal of the California dream'
      }
    }
  };

  readonly execute = async (promptAsString: string) => {
    try {
      const prompt = JSON.parse(promptAsString);
      const imageHandler = new ImageHandler();
      const channelId = prompt.channelId;

      const result = await fal.subscribe('fal-ai/flux/dev', {
        input: {
          prompt: prompt.imagePrompt,
          enable_safety_checker: false
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        }
      });

      console.log(result);

      const imgUrls = result.images.map((element) => {
        return element.url;
      });

      await imageHandler.downloadImages(imgUrls, channelId);

      return JSON.stringify({ image_ready: true });
    }
    catch (error: unknow) {
      console.log(error);
      if (error && error.status === 400) {
        return error?.error?.message || null;
      }
    }
  };
}
