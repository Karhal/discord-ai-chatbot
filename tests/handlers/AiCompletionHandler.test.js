import AiCompletionHandler from './../../handlers/AiCompletionHandler.js';
import { aiClient } from '../../clients/ai-client.js';
import { tools, readMemory } from '../../tools.js';
jest.mock('../../clients/ai-client.js');
jest.mock('../../tools.js');

describe('AiCompletionHandler', () => {
  let aiCompletionHandler;
  const mockPrompt = 'Test prompt';
  const mockTools = {};

  beforeEach(() => {
    aiCompletionHandler = new AiCompletionHandler(aiClient, mockPrompt, mockTools);
  });

  describe('getSummary', () => {
    it('should resolve with correct summary content', async () => {
      const mockSummary = 'This is a summary.';
      aiClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockSummary } }]
      });

      const summary = await aiCompletionHandler.getSummary('channelId');
      expect(summary).toBe(mockSummary);
    });
  });

  describe('addMessageToChannel', () => {
    it('should add a message to an empty channel', () => {
      const message = { channelId: '123', content: 'Hello' };
      aiCompletionHandler.addMessageToChannel(message);

      expect(aiCompletionHandler.messages).toContain(message);
    });

    it('should remove the oldest message when exceeding maxHistory', () => {
      const maxHistory = 1;
      process.env.MAX_HISTORY = maxHistory.toString();
      const firstMessage = { channelId: '123', content: 'First' };
      const secondMessage = { channelId: '123', content: 'Second' };

      aiCompletionHandler.addMessageToChannel(firstMessage);
      aiCompletionHandler.addMessageToChannel(secondMessage);

      expect(aiCompletionHandler.messages).not.toContain(firstMessage);
      expect(aiCompletionHandler.messages).toContain(secondMessage);
    });
  });

  // Additional tests for other methods would follow a similar structure
});