import AiCompletionHandler from '../handlers/ai-completion-handler.js';
import AIClient from '../clients/ai-client.js';
import { setCurrentMessage, setCompletionHandler, tools } from '../tools.js';
import config from '../config.js';
import EventDiscord from '../clients/events-discord.js';
import ImageHandler from '../handlers/image-handler.js';
import { Events } from 'discord.js';

export default class MessageCreate extends EventDiscord {
    eventName = Events.MessageCreate;
    handler = async function execute(message) {
        const maxHistory = config.discord.maxHistory;
        if (!this.theMessageContainsBotName(message) || message.author.id === this.client.user.id) return;

        const channelId = message.channelId;
        const messagesChannelHistory = await message.channel.messages.fetch({ limit: maxHistory });
        message.channel.sendTyping();

        const aiCompletionHandler = new AiCompletionHandler(new AIClient(), config.openAI.prompt, tools);
        aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);

        const summary = await aiCompletionHandler.getSummary(channelId);
        if(summary){
            let completion = await aiCompletionHandler.getAiCompletion(summary, channelId);
            let content = completion.content;
            
            const image = new ImageHandler(message,content);
            const images = image.getImages();

            message.channel.sendTyping();
            await this.sendResponse(message, content, images);
            if (images && images.length > 0) {
                image.deleteImages(images);
            }
        }

        console.log('Done.');
	};

    async sendResponse(message, response, imagePaths) {
        response = response.trim().replace(/\n\s*\n/g, '\n');
        message.channel.send(response);
        if(imagePaths.length > 0) {
            await message.channel.send({ files: imagePaths });
            console.log('Images sent');
        }
        return true;
    }

    theMessageContainsBotName(message) {
        const botName = config.discord.botName;
        return message.content.toLowerCase().includes(botName.toLowerCase());
    }
};
