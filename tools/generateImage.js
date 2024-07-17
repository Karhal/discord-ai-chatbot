import { aiClient } from '../clients/ai-client.js';
import config from '../config.json' assert { type: 'json' };

const imageSize = process.env.IMAGE_SIZE || config.imageSize;

const generateImage = async (imagePrompt) => {

    try {
        const prompt = JSON.parse(imagePrompt);
        const response = await aiClient.images.generate({
            model: "dall-e-3",
            prompt: prompt.imagePrompt,
            n: 1,
            size: imageSize,
        });
        return { "image_url": response.data[0].url };
    } catch (error) {
        console.log(error);
        if (error && error.status === 400) {
            return { "error": error.error.message };
        }
    }
    /*const prompt = JSON.parse(imagePrompt);
    console.log(prompt.imagePrompt);
    console.log({
        model: "dall-e-3",
        prompt: prompt.imagePrompt,
        n: 1,
        size: imageSize,
    });
    const response = await aiClient.images.generate({
        model: "dall-e-3",
        prompt: prompt.imagePrompt,
        n: 1,
        size: imageSize,
    });
    return { "image_url": response.data[0].url };*/
};

const generateImageTool = {
    type: 'function',
    function: {
        function: generateImage,
        description: "Use this tool when the user asks you to draw or to show a picture of something. The tool will generate an image based on the prompt you provide.",
        parameters: {
            type: 'object',
            properties: {
                imagePrompt: { type: 'string' },
            },
        },
    },
};

export default generateImageTool;