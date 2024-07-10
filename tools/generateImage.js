const { aiClient } = require('../clients/ai-client');
const { imageSize } = require('../config.json');

async function generateImage(imagePrompt) {
    return await aiClient.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: imageSize,
    }).then((response) => {
        return { "image_url": response.data[0].url };
    });
}

const generateImageTool = 
{
    type: 'function',
    function: {
        function: generateImage,
        description: "use this tool only when asked to generate an image or to get the picture of what the user asks",
        parameters: {
        type: 'object',
        properties: {
            imagePrompt: { type: 'string' },
        },
        },
    },
}

module.exports = generateImageTool;