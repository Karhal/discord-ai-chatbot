import AiCompletionHandler from '../handlers/AiCompletionHandler.js';
import AIClient from '../clients/ai-client.js';
import { setCurrentMessage, setCompletionHandler, tools } from '../tools.js';
import config from '../config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import EventDiscord from './../clients/events-discord.js';
import { Events } from 'discord.js';

const botName = config.botName;
const maxHistory = config.maxHistory;
const filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filename);
const imageRegex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;

export default class MessageCreate extends EventDiscord {
    eventName = Events.MessageCreate;
    handler = async (message) => {

        if (!this.theMessageContainsBotName(message) || message.author.id === this.client.user.id) return;

        let images = [];
        let channelId = message.channelId;
        message.channel.sendTyping();
        const aiCompletionHandler = new AiCompletionHandler(new AIClient(), config.prompt, tools);
        const messagesChannelHistory = await message.channel.messages.fetch({ limit: maxHistory });
        
        aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);

        const summary = await aiCompletionHandler.getSummary(channelId).catch(err => console.log(err));
        let completion = await aiCompletionHandler.getAiCompletion(summary, channelId);
        const imagesUrls = this.extractImages(completion.content);
        images = await this.downloadImages(imagesUrls);

        completion = completion.content;
        message.channel.sendTyping();
        completion = this.cleanImagePathsFromResponse(completion);
        await this.sendResponse(message, completion, images);
        if (images.length > 0) {
            this.deleteImages(images);
        }
        console.log('Done.');
	};

    theMessageContainsBotName = function (message) {
        return message.content.toLowerCase().includes(botName.toLowerCase());
    }

    downloadImages = async function (images) {

        if (!images) return [];
        images = await Promise.all(images.map(async image => {
            console.log('Downloading images...');
            const response = await fetch(image);
            const responseBuffer = await response.arrayBuffer();
            return this.saveImage(responseBuffer);
        }));
        console.log('Images downloaded...');
        console.log(images);
    
        return images;
    }

    saveImage = function (response) {
        const timestamp = new Date().getTime();
        const imageName = timestamp+'.jpg';
        const imageData = Buffer.from(response, 'binary');
        const imagePath = path.join(__dirname, './../tmp', imageName);
        
        console.log('Saving image to ' + imagePath);
        fs.writeFileSync(imagePath, imageData);
    
        return imagePath;
    }

    cleanImagePathsFromResponse = function (response) {
        const regex = /\[.*?\]\(https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net.*?\)/g;
        const matches = response.match(regex);
        console.log('cleaning images...');
        if (!matches) return response;
        matches.forEach(match => {
            response = response.replace(match, '');
        });
        return response;
    }

    extractImages = function (response) {
        const imageUrls = response.match(imageRegex);
        console.log('Images extracted...');
        console.log(imageUrls);
        return imageUrls;
    }

    deleteImages = function (imagePaths) {
        imagePaths.forEach(imagePath => {
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
            }
        });
    }

    sendResponse = async function (message, response, imagePaths) {
        response = response.trim().replace(/\n\s*\n/g, '\n');
        message.channel.send(response);
        if(imagePaths.length > 0) {
            await message.channel.send({ files: imagePaths });
            console.log('Images sent');
        }
    }
};
