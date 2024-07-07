const { aiClient } = require('./clients/ai-client');
const { imageSize } = require('./config.json');
const { joinVoiceChannel } = require('@discordjs/voice');
const VoiceTranscriptor = require('./VoiceTranscriptor.js');

let audioConnection = null;
let currentMessage = null;

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

function setCurrentMessage(message) {
    currentMessage = message;
}

async function joinDiscordChannel(channelName) {

    channelName = JSON.parse(channelName).channelName;
    console.log('Looking for channel: ' + channelName);

    const voiceChannel = currentMessage.guild.channels.cache.find(channel => channel.name === channelName);

    if (voiceChannel) {
        console.log("Channel " + channelName + " found");

        audioConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        audioConnection.receiver.speaking.on('start', (userId) => {
            const voiceTrascriptor = new VoiceTranscriptor(audioConnection);
            voiceTrascriptor.listen(userId);
          }); // When someone talks

        return "Joined channel " + channelName;
    }

    console.log("Channel " + channelName + " not found");
}

const tools = 
[
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
  ]

module.exports = {
    tools,
    setCurrentMessage
}