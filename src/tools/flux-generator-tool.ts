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
          Your prompt should systematically integrate ten critical components to maximize \
          image quality and creative output. \
          Start with a crystal-clear topic description that captures not just what you want to see, \
          but the intricate nuances of the scene. \
          Specify the material rendering style—whether digital painting, photorealistic render, \
          or abstract sketch—which fundamentally shapes the image\'s visual texture. \
          Articulate a specific artistic style or boldly combine multiple aesthetic approaches to create unique visual \
          landscapes. Elevate your prompt by invoking renowned artists whose signature styles can profoundly \
          influence the image\'s character. Leverage art platform references like ArtStation to \
          signal high-quality conceptual expectations. \
          Emphasize sharpness and detail through precise descriptive language, ensuring crisp, \
          well-defined visual elements. Atmospheric depth comes from carefully chosen extra details \
          that communicate mood and emotional tone. Manipulate shade, color, and lighting to create specific visual \
          atmospheres—whether moody, dramatic, or subtly nuanced. \
          Each descriptive layer adds complexity and richness to the generated image. \
          Crucially, include negative prompts to explicitly exclude undesired elements, technical imperfections, \
          or stylistic aberrations. This final filtering mechanism ensures the output aligns \
          precisely with your creative vision. \
          The ultimate prompt is a symphonic blend of specificity, creativity, \
          and technical guidance—a linguistic blueprint that transforms textual imagination into visual reality. '
      }
    }
  };

  readonly execute = async (promptAsString: string) => {
    try {
      const prompt = JSON.parse(promptAsString);

      const imageHandler = new ImageHandler();

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

      await imageHandler.downloadImages(imgUrls);

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
