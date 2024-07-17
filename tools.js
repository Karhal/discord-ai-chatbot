import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const toolsDir = path.join(__dirname, 'tools');
const tools = [];

fs.readdirSync(toolsDir).filter(file => file.endsWith('.js')).forEach(file => {
  import(path.join(toolsDir, file)).then(module => {
    tools.push(module.default);
  });
});

let audioConnection = null;
let currentMessage = null;
let completionHandler = null;

const setCurrentMessage = (message) => {
    currentMessage = message;
};

const setCompletionHandler = (completion) => {
    completionHandler = completion;
};

const readMemory = async () => {
  const filePath = path.join(__dirname, 'memory.txt');
  if (!fs.existsSync(filePath)) {      

      return '';
  }
  const data = fs.readFileSync(filePath, 'utf8');
  const facts = data.split('\n').map(line => line.trim()).join('; ');

  return facts;
};

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
            const voiceTranscriptor = new VoiceTranscriptor(audioConnection, completionHandler);
            voiceTranscriptor.listen(userId);
          }); // When someone talks

        return "Joined channel " + channelName;
    }

    console.log("Channel " + channelName + " not found");
}
*/

export {
    tools,
    setCurrentMessage,
    setCompletionHandler,
    readMemory
}