import AiCompletionHandler from '../handlers/ai-completion-handler';
import AIClient from '../clients/ai-client';
import { tools } from '../tools';
import config from '../config';
import EventDiscord from '../clients/events-discord';
import ImageHandler from '../handlers/image-handler';
import { Events, Message } from 'discord.js';

export default class MessageCreate extends EventDiscord {
	eventName = Events.MessageCreate;
	handler = async (message: Message) => {
		const maxHistory = config.discord.maxHistory;
		if (
			!this.theMessageContainsBotName(message) ||
			message.author.id === this?.client?.user?.id
		) {
			return;
		}

		const channelId = message.channelId;
		const messagesChannelHistory = await message.channel.messages.fetch({
			limit: maxHistory,
		});
		message.channel.sendTyping();

		const aiCompletionHandler = new AiCompletionHandler(
			new AIClient(),
			config.openAI.prompt,
			tools,
		);
		aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);

		const summary = await aiCompletionHandler.getSummary(channelId);
		if (summary) {
			const completion = await aiCompletionHandler.getAiCompletion(
				summary,
				channelId,
			);
			const content = completion.content;

			const image = new ImageHandler(message, content);
			const images = await image.getImages();

			message.channel.sendTyping();
			await this.sendResponse(message, content, images);
			if (images && images.length > 0) {
				image.deleteImages(images);
			}
		}

		console.log('Done.');
	};

	async sendResponse(message: Message, response: string, imagePaths: string[]) {
		response = response.trim().replace(/\n\s*\n/g, '\n');
		message.channel.send(response);
		if (imagePaths.length > 0) {
			await message.channel.send({ files: imagePaths });
			console.log('Images sent');
		}
		return true;
	}

	theMessageContainsBotName(message: Message) {
		const botName = config.discord.botName;
		return message.content.toLowerCase().includes(botName.toLowerCase());
	}
}
