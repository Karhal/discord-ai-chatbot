const { aiClient } = require('./ai-client');
const { prompt } = require('./config.json');
const { generateImage, joinDiscordChannel, setCurrentMessage } = require('./tools');

async function getAiSummary(conversation) {
    return await aiClient.chat.completions.create({
        messages: [
        { role: 'assistant', content: 'Fais un résumé de cette discussion: ', }, 
        { role: 'user', content: conversation, }
    ],
        model: 'gpt-4o',
    });
}

async function getAiCompletion(message, conversationSummary) {

  setCurrentMessage(message);
  const userMessage = message.author.username+': ' + message.content;

  const runner = aiClient.beta.chat.completions
    .runTools({
      model: 'gpt-4o',
      messages: [
        {
            role: 'assistant', 
            content: prompt + ' The context of the conversation is: ' + conversationSummary + ' END OF CONTEXT. Please react to the last message only'
        },
        {
            role: 'user',
            content: userMessage,
        }
    ],
      tools: [
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
          },
          {
            type: 'function',
            function: {
              function: joinDiscordChannel,
              description: "Use this tool only to join a voice channel in discord when asked to",
              parameters: {
                type: 'object',
                properties: {
                    channelName: { type: 'string' },
                },
              },
            },
          },
      ],
    })
    .on('message', () => {});

  return await runner.finalContent();

}

module.exports = {
    getAiCompletion,
    getAiSummary,
  };