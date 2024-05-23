
const OpenAI = require('openai');
const { openaiKey, prompt, imageSize } = require('./config.json');
const { joinVoiceChannel } = require('@discordjs/voice');

require('dotenv').config();

const client = new OpenAI({
    apiKey: openaiKey|| process.env.OPENAI_API_KEY,
  });

module.exports = {
    getAiCompletion,
    getAiSummary
};

let voiceChannels = null;

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

  const userMessage = message.author.username+': ' + message.content;
  voiceChannels = message.channel.guild.channels.cache.filter(channel => channel.type === 2);

  const runner = client.beta.chat.completions
    .runTools({
      model: 'gpt-4o',
      messages: [
        { 
            role: 'assistant', 
            content: prompt+' The context of the conversation is: ' + context + ' END OF CONTEXT. Please react to the last message only'
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
              description: "use this tool only when asked to generate an image",
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

async function generateImage(imagePrompt) {
    return await client.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: imageSize,
      }).then((response) => {
        //console.log({"image_url": response.data[0].url });
        return {"image_url": response.data[0].url };
      });      
}

async function joinDiscordChannel(channelName) {
  channelName = JSON.parse(channelName).channelName;
  console.log('Looking for channel: ' + channelName);

  const voiceChannel = voiceChannels.find(channel => channel.name === channelName);
  if (voiceChannel) {
    console.log("Channel " + channelName + " found");

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    return;
  }

  console.log("Channel " + channelName + " not found");
}
