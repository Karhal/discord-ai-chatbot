import AIClient from '../clients/ai-client';
import ImageHandler from '../handlers/image-handler';

const generateImage = async (imagePrompt: string) => {
  try {
    const prompt = JSON.parse(imagePrompt);
    const client = new AIClient();
    const imageHandler = new ImageHandler();

    const imgUrl = await client.generateImage(prompt.imagePrompt);
    if (imgUrl) {
      await imageHandler.downloadImages([imgUrl]);
    }
    return JSON.stringify({ image_ready: true });
  }
  catch (error: unknow) {
    console.log(error);
    if (error && error.status === 400) {
      return error?.error?.message || null;
    }
  }
};

const generateImageTool = {
  type: 'function',
  function: {
    function: generateImage,
    description:
      'Use this tool only when the user asks you to draw or to show a picture of something in the last message. \
      The tool will generate an image based on the prompt you provide and add it as an attachment on discord. \
      The more specific your prompt, the better the image quality. \
      Include details like the setting, objects, colors, mood, and any specific elements you want in the image. \
      Consider Perspective and Composition. Specify Lighting and Time of Day. \
      Specify Desired Styles or Themes.',
    parameters: {
      type: 'object',
      properties: {
        imagePrompt: { type: 'string' }
      }
    }
  }
};

export default generateImageTool;
