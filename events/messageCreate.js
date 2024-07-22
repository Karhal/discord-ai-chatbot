import { Events } from 'discord.js';
import aiCompletionHandler from '../handlers/AiCompletionHandler.js';
import { setCurrentMessage, setCompletionHandler } from '../tools.js';
import config from '../config.json' assert { type: 'json' };
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const botName = config.botName;
const maxHistory = config.maxHistory;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageRegex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;

export default {
	name: Events.MessageCreate,
	once: false,
	execute(message) {

        let finalResponse = '';
        let hasImage = false;
        let imagePaths = [];
        let channelId = message.channelId;

        if (!message.content.toLowerCase().includes(botName.toLowerCase()) || message.author.bot) return;

        message.channel.sendTyping();
        
        fetchAndProcessMessages(message).then(() => {
            console.log('Building summary...');

            return aiCompletionHandler.getSummary(channelId);

        }).then((summary) => {
            console.log('Getting completion...');
            message.channel.sendTyping();
            setCurrentMessage(message);
            setCompletionHandler(aiCompletionHandler);
            
            return aiCompletionHandler.getAiCompletion(summary, channelId);

        }).then(async (completion) => {
            console.log('Completion received...');
            console.log(completion);
            console.log('images matchs...');
            const imageUrls = completion.match(imageRegex)?.filter(url => url.includes('oaidalleapiprodscus'));
            finalResponse = completion;

            if (imageUrls && imageUrls.length > 0) {
                message.channel.sendTyping();
                await Promise.all(imageUrls.map(async imageUrl => {
                    console.log('Image detected...');
                    finalResponse = finalResponse.replace(imageUrl, '').replace(/!\[.*\]\(\)/, '');
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    imagePaths.push(saveImage(response));
                }));
            }
            return;

        }).then(async () => {
            console.log('Image length:');
            console.log(imagePaths.length);
            finalResponse = finalResponse.trim().replace(/\n\s*\n/g, '\n');
            message.channel.send(finalResponse);
            if(imagePaths.length > 0) {
                await message.channel.send({ files: imagePaths });
                console.log('Images sent');
            }
            
        }).finally(() => {

            if(imagePaths.length > 0) {
                imagePaths.forEach(imagePath => {
                    if (fs.existsSync(imagePath)) {
                        fs.unlink(imagePath, (err) => {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('Image deleted:', imagePath);
                            }
                        });
                    }
                });
            }
            console.log('Done.');
        });
	},
};

function saveImage(response) {
    const timestamp = new Date().getTime();
    const imageName = timestamp+'.jpg';
    const imageData = Buffer.from(response.data, 'binary');
    const imagePath = path.join(__dirname, './../tmp', imageName);
    console.log('Saving image to ' + imagePath);
    fs.writeFileSync(imagePath, imageData);

    return imagePath;
}

function fetchAndProcessMessages(message) {

    return new Promise((resolve, reject) => {
        try {
            message.channel.messages.fetch({ limit: maxHistory }).then(messages => {
                messages = messages.reverse();
                messages.forEach(msg => {
                    if(msg.content !== '') {
                        const role = msg.author.bot ? 'assistant' : 'user';
                        aiCompletionHandler.messages.push({ role: role, content: msg.content, dateTime: msg.createdAt, channelId: msg.channelId, author: msg.author.username });
                        const channelMessages = aiCompletionHandler.messages.filter(msg => msg.channelId === message.channelId);
                        if (channelMessages.length >= maxHistory) {
                            aiCompletionHandler.messages = aiCompletionHandler.messages.filter(msg => msg.channelId !== message.channelId);
                            aiCompletionHandler.messages = [...channelMessages, ...aiCompletionHandler.messages];
                        }
                    }
                });
            });
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}