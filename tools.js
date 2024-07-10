const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'tools');
const tools = [];

fs.readdirSync(toolsDir).filter(file => file.endsWith('.js')).forEach(file => {
  tools.push(require(path.join(toolsDir, file)));
});


let audioConnection = null;
let currentMessage = null;
let completionHandler = null;

function setCurrentMessage(message) {
    currentMessage = message;
}

function setCompletionHandler(completion) {
    completionHandler = completion;
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
console.log(tools);

/*
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
*/


module.exports = {
    tools,
    setCurrentMessage,
    setCompletionHandler,
    readMemory
}