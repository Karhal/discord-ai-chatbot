const { aiClient } = require('./clients/ai-client');
const { imageSize } = require('./config.json');
const { joinVoiceChannel } = require('@discordjs/voice');
const VoiceTranscriptor = require('./VoiceTranscriptor.js');
const fs = require('fs');
const path = require('path');

let audioConnection = null;
let currentMessage = null;
let completionHandler = null;

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

function setCompletionHandler(completion) {
    completionHandler = completion;
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
        console.log('Handler : ');
        console.log(completionHandler);
        audioConnection.receiver.speaking.on('start', (userId) => {
            const voiceTrascriptor = new VoiceTranscriptor(audioConnection, completionHandler);
            voiceTrascriptor.listen(userId);
          }); // When someone talks

        return "Joined channel " + channelName;
    }

    console.log("Channel " + channelName + " not found");
}

async function writeMemory(memory) {

  memory = JSON.parse(memory).memoryString;
  const filePath = path.join(__dirname, 'memory.txt');
  let facts = [];
  if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf8');
  }
  const data = fs.readFileSync(filePath, 'utf8');
  facts = data.split('\n').filter(line => line.trim() !== '');

  console.log("Memory: " + memory);
  facts.push(memory);

  if (facts.length > 10) {
      facts = facts.slice(facts.length - 10);
  }

  fs.writeFileSync(filePath, facts.join('\n'), 'utf8');
}

async function readMemory() {
  const filePath = path.join(__dirname, 'memory.txt');
  if (!fs.existsSync(filePath)) {      
      console.log('Memory file does not exist.');
      return '';
  }
  const data = fs.readFileSync(filePath, 'utf8');
  const facts = data.split('\n').filter(line => line.trim() !== '');
  console.log('Memory read: ', facts.join(', '));
  
  return facts;
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
      {
        type: 'function',
        function: {
          function: writeMemory,
          description: "Use this tool when the user is asking to you to remember an information. Store only what the user says and nothing else.",
          parameters: {
            type: 'object',
            properties: {
                memoryString: { type: 'string' },
            },
          },
        },
      },
  ]

module.exports = {
    tools,
    setCurrentMessage,
    setCompletionHandler,
    readMemory
}