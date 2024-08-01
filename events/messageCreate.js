import AiCompletionHandler from '../handlers/AiCompletionHandler.js';
import AIClient from '../clients/ai-client.js';
import { setCurrentMessage, setCompletionHandler, tools } from '../tools.js';
import config from '../config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import EventDiscord from './../clients/events-discord.js';
import { Events } from 'discord.js';

export default class MessageCreate extends EventDiscord {
    eventName = Events.MessageCreate;
    handler = async function execute(message) {
        const maxHistory = config.maxHistory;
        if (!this.theMessageContainsBotName(message) || message.author.id === this.client.user.id) return;

        const channelId = message.channelId;
        const messagesChannelHistory = await message.channel.messages.fetch({ limit: maxHistory });
        message.channel.sendTyping();

        const aiCompletionHandler = new AiCompletionHandler(new AIClient(), config.prompt, tools);
        aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);

        const summary = await aiCompletionHandler.getSummary(channelId);
        if(summary){
            let completion = await aiCompletionHandler.getAiCompletion(summary, channelId);
            let content = completion.content;
            
            let images = await this.getImages(content);
            if(images && images.length > 0){
                message.channel.sendTyping();
                content = this.cleanImagePathsFromResponse(content);
            }
            message.channel.sendTyping();
            await this.sendResponse(message, content, images);
            if (images && images.length > 0) {
                this.deleteImages(images);
            }
        }

        console.log('Done.');
	};

    async getImages(content){
        const imagesUrls = this.extractImages(content);
        const images = await this.downloadImages(imagesUrls);
        return images;
    }

    async sendResponse(message, response, imagePaths) {
        response = response.trim().replace(/\n\s*\n/g, '\n');
        message.channel.send(response);
        if(imagePaths.length > 0) {
            await message.channel.send({ files: imagePaths });
            console.log('Images sent');
        }
        return true;
    }

    cleanImagePathsFromResponse(response) {
        const regex = /\[.*?\]\(https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net.*?\)/g;
        const matches = response.match(regex);
        if (!matches) return response;

        matches.forEach(match => {
            response = response.replace(match, '');
        });

        return response;
    }

    deleteImages(imagePaths) {
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

    async downloadImages(images) {
        if (!images) return [];
        images = await Promise.all(images.map(async image => {
            console.log('Downloading images ' + image);
            const response = await fetch(image);
            const responseBuffer = await response.arrayBuffer();
            return this.saveImage(responseBuffer);
        }));
        console.log('Images downloaded',images);
        return images;
    }
    

    saveImage(response) {
        const _filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(_filename);
        const timestamp = new Date().getTime();
        const imageName = timestamp+'.jpg';
        const imageData = Buffer.from(response, 'binary');
        const imagePath = path.join(__dirname, './../tmp', imageName);
        
        console.log('Saving image to ' + imagePath);
        fs.writeFileSync(imagePath, imageData);
    
        return imagePath;
    }

    extractImages(response) {
        const imageRegex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
        const imageUrls = response.match(imageRegex);
        return imageUrls;
    }

    theMessageContainsBotName(message) {
        const botName = config.botName;
        return message.content.toLowerCase().includes(botName.toLowerCase());
    }
};
