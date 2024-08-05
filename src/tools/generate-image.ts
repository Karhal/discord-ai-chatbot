import AIClient from '../clients/ai-client';

const generateImage = async (imagePrompt: string) => {
  try {
    const prompt = JSON.parse(imagePrompt);
    const client = new AIClient();
    const response = await client.generateImage(prompt.imagePrompt);

    return response;
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
      'Use this tool when the user asks you to draw or to show a picture of something. The tool will generate an image based on the prompt you provide. The more specific your prompt, the better the image quality. Include details like the setting, objects, colors, mood, and any specific elements you want in the image. Consider Perspective and Composition. Specify Lighting and Time of Day. Use Analogies or Comparisons. Specify Desired Styles or Themes. Please Include the response in the "content" property of the JSON object.',
    parameters: {
      type: 'object',
      properties: {
        imagePrompt: { type: 'string' }
      }
    }
  }
};

export default generateImageTool;
