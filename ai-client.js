
const OpenAI = require('openai');
const { openaiKey, prompt, imageSize } = require('./config.json');
require('dotenv').config();

const client = new OpenAI({
    apiKey: openaiKey|| process.env.OPENAI_API_KEY,
  });

module.exports = {
    getAiCompletion,
    getAiSummary
};

async function getAiSummary(conversation) {
    return await client.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Fais un résumé de cette discussion: ', }, 
        { role: 'user', content: conversation, }
    ],
      model: 'gpt-4o',
    });
    
  }

async function getAiCompletion(message, context) {
    
  const runner = client.beta.chat.completions
    .runTools({
      model: 'gpt-4o',
      messages: [
        { 
            role: 'assistant', 
            content: prompt+' The context of the conversation is: ' + context + '. Please react to the last message only'
        },
        {
            role: 'user',
            content: message,
        }
    ],
      tools: [
        {
            type: 'function',
            function: {
              function: generateImage,
              parameters: {
                type: 'object',
                properties: {
                    imagePrompt: { type: 'string' },
                },
              },
            },
          },
      ],
    })
    .on('message', (message) => console.log(message));

  return await runner.finalContent();

}

async function generateImage(imagePrompt) {
    return await client.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: imageSize,
      })
      ;
      
}