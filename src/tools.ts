import fs from 'fs';
import path from 'path';

const toolsDir = './tools';
const tools:any[] = [];

fs.readdirSync(toolsDir).filter(file => file.endsWith('.js')).forEach(file => {
  import(path.join(toolsDir, file)).then(module => {
    tools.push(module.default);
  });
});

let audioConnection = null;
let currentMessage = null;
let completionHandler = null;

const setCurrentMessage = (message:string) => {
    currentMessage = message;
};

const setCompletionHandler = (completion:Function) => {
    completionHandler = completion;
};

const readMemory = () => {
    const memoryFilePath = path.join(dirname_, 'memory.txt');
    if(!fs.existsSync(memoryFilePath)){
        fs.writeFileSync(memoryFilePath,'', 'utf8')
    }
    const memoryData = fs.readFileSync(memoryFilePath, 'utf8');
    return memoryData;
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