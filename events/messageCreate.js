import { Events } from 'discord.js';
import AiCompletionHandler from '../handlers/AiCompletionHandler.js';
import { aiClient } from '../clients/ai-client.js';
import { setCurrentMessage, setCompletionHandler, tools } from '../tools.js';
import config from '../config.js';
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
	async execute(message) {

        if (!message.content.toLowerCase().includes(botName.toLowerCase()) || message.author.bot) return;

        let images = [];
        let channelId = message.channelId;
        message.channel.sendTyping();
        const aiCompletionHandler = new AiCompletionHandler(aiClient, config.prompt, tools);
        const messagesChannelHistory = await message.channel.messages.fetch({ limit: maxHistory });
        
        aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);

        const summary = await aiCompletionHandler.getSummary(channelId).catch(err => console.log(error));
        let completion = await aiCompletionHandler.getAiCompletion(summary, channelId);
        const imagesUrls = extractImages(completion.content);
        images = await downloadImages(imagesUrls);
        completion = completion.content;
        message.channel.sendTyping();
        completion = cleanImagePathsFromResponse(completion);
        await sendResponse(message, completion, images);
        if (images.length > 0) {
            deleteImages(images);
        }
        console.log('Done.');
	},
};

async function downloadImages(images) {

    if (!images) return [];
    images = await Promise.all(images.map(async image => {
        console.log('Downloading images...');
        const response = fetch(image);
        const responseBuffer = response.arrayBuffer();
        return saveImage(responseBuffer);
    }));
    console.log('Images downloaded...');
    console.log(images);

    return images;
}

function saveImage(response) {
    const timestamp = new Date().getTime();
    const imageName = timestamp+'.jpg';
    const imageData = Buffer.from(response.data, 'binary');
    const imagePath = path.join(__dirname, './../tmp', imageName);
    
    console.log('Saving image to ' + imagePath);
    fs.writeFileSync(imagePath, imageData);

    return imagePath;
}

function cleanImagePathsFromResponse(response) {
    const regex = /\[.*?\]\(https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net.*?\)/g;
    const matches = response.match(regex);
    console.log('cleaning images...');
    if (!matches) return response;
    matches.forEach(match => {
        response = response.replace(match, '');
    });
    return response;
}

function extractImages(response) {
    const imageUrls = response.match(imageRegex);
    console.log('Images extracted...');
    console.log(imageUrls);
    return imageUrls;
}

async function sendResponse(message, response, imagePaths) {
    response = response.trim().replace(/\n\s*\n/g, '\n');
    message.channel.send(response);
    if(imagePaths.length > 0) {
        await message.channel.send({ files: imagePaths });
        console.log('Images sent');
    }
}

function deleteImages(imagePaths) {
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