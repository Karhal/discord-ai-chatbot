/* eslint-disable no-undef */
import AiCompletionHandler from './../../src/handlers/ai-completion-handler';

jest.mock('./../../src/clients/ai-client');
jest.mock('./../../src/tools');

describe('AiCompletionHandler', () => {
	const mockPrompt = 'Test prompt';
	const mockTools = {};

	describe('addMessageToChannel', () => {
		it('should add a message to an empty channel', () => {
			const aiCompletionHandler = new AiCompletionHandler(
				null,
				mockPrompt,
				mockTools
			);
			const message = {
				role: 'user',
				content: 'lorem',
				dateTime: '123',
				channelId: 2,
				author: 'Ipsum',
			};
			aiCompletionHandler.addMessageToChannel(message);

			expect(aiCompletionHandler.messages).toContain(message);
		});

		it('should remove the oldest message when exceeding maxHistory', () => {
			const aiCompletionHandler = new AiCompletionHandler(
				null,
				mockPrompt,
				mockTools
			);
			const firstMessage = {
				role: 'user',
				content: 'first',
				dateTime: '123',
				channelId: 1,
				author: 'Ipsum',
			};
			const secondMessage = {
				role: 'assistant',
				content: 'second',
				dateTime: '123',
				channelId: 1,
				author: 'Lorem',
			};
			aiCompletionHandler.addMessageToChannel(firstMessage, 1);
			aiCompletionHandler.addMessageToChannel(secondMessage, 1);

			expect(
				aiCompletionHandler.messages.filter((msg) => msg.channelId === 1).length
			).toBe(1);
			expect(
				aiCompletionHandler.messages.filter((msg) => msg.channelId === 1)
			).not.toContain(firstMessage);
			expect(
				aiCompletionHandler.messages.filter((msg) => msg.channelId === 1)
			).toContain(secondMessage);
		});

		it('should add an array of messages to the messages array', () => {
			const aiCompletionHandler = new AiCompletionHandler(
				null,
				mockPrompt,
				mockTools
			);
			const firstMessage = {
				role: 'user',
				content: 'first',
				dateTime: '123',
				channelId: 1,
				author: 'Ipsum',
			};
			const secondMessage = {
				role: 'assistant',
				content: 'second',
				dateTime: '123',
				channelId: 1,
				author: 'Lorem',
			};
			aiCompletionHandler.addMessageArrayToChannel(
				[firstMessage, secondMessage],
				2
			);

			expect(
				aiCompletionHandler.messages.filter((msg) => msg.channelId === 1).length
			).toBe(2);
			expect(
				aiCompletionHandler.messages.filter((msg) => msg.channelId === 1)
			).toContain(firstMessage);
			expect(
				aiCompletionHandler.messages.filter((msg) => msg.channelId === 1)
			).toContain(secondMessage);
		});

		it('should give me the X last messages of an given channel', () => {
			const aiCompletionHandler = new AiCompletionHandler(
				null,
				mockPrompt,
				mockTools
			);
			const firstMessage = {
				role: 'user',
				content: 'first',
				createdAt: '123',
				channelId: 1,
				author: { username: 'Ipsum' },
			};
			const secondMessage = {
				role: 'assistant',
				content: 'second',
				createdAt: '123',
				channelId: 1,
				author: { username: 'Ipsum' },
			};
			const thirdMessage = {
				role: 'user',
				content: 'third',
				createdAt: '123',
				channelId: 1,
				author: { username: 'LoremIpsum' },
			};
			aiCompletionHandler.addMessageArrayToChannel(
				[firstMessage, secondMessage, thirdMessage],
				3
			);

			expect(aiCompletionHandler.getLastMessagesOfAChannel(2, 1)).toContain(
				secondMessage
			);
			expect(aiCompletionHandler.getLastMessagesOfAChannel(2, 1)).toContain(
				thirdMessage
			);
		});

		it('should give me the X first messages of an given channel', () => {
			const aiCompletionHandler = new AiCompletionHandler(
				null,
				mockPrompt,
				mockTools
			);
			const firstMessage = {
				role: 'user',
				content: 'first',
				createdAt: '123',
				channelId: 1,
				author: { username: 'Ipsum' },
			};
			const secondMessage = {
				role: 'assistant',
				content: 'second',
				createdAt: '123',
				channelId: 1,
				author: { username: 'Lorem' },
			};
			const thirdMessage = {
				role: 'user',
				content: 'third',
				createdAt: '123',
				channelId: 1,
				author: { username: 'LoremIpsum' },
			};
			aiCompletionHandler.addMessageArrayToChannel(
				[firstMessage, secondMessage, thirdMessage],
				3
			);

			expect(aiCompletionHandler.getFirstMessagesOfAChannel(2, 1)).toContain(
				firstMessage
			);
			expect(aiCompletionHandler.getFirstMessagesOfAChannel(2, 1)).toContain(
				secondMessage
			);
		});

		it('should set a Channel History From a discord messages array', () => {
			const aiCompletionHandler = new AiCompletionHandler(
				null,
				mockPrompt,
				mockTools
			);
			const firstDiscordMessage = {
				content: 'first',
				createdAt: '123',
				channelId: 1,
				author: { username: 'Ipsum', bot: false },
			};
			const secondDiscordMessage = {
				content: 'second',
				createdAt: '123',
				channelId: 1,
				author: { username: 'Lorem', bot: true },
			};
			aiCompletionHandler.setChannelHistory(1, [
				firstDiscordMessage,
				secondDiscordMessage,
			]);

			expect(
				aiCompletionHandler.messages.filter((msg) => msg.channelId === 1).length
			).toBe(2);
			expect(
				aiCompletionHandler.messages.filter((msg) => msg.channelId === 1)
			).toEqual([
				{
					role: 'assistant',
					content: '{"author":"Lorem","content":"second","dateTime":"123"}',
					channelId: 1,
				},
				{
					role: 'user',
					content: '{"author":"Ipsum","content":"first","dateTime":"123"}',
					channelId: 1,
				},
			]);
		});
	});
});
