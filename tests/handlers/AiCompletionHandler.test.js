/* eslint-disable no-undef */
import AiCompletionHandler from './../../src/handlers/ai-completion-handler';
import ConfigManager from '../../src/configManager';

// Mock the ConfigManager
jest.mock('../../src/configManager', () => {
  return {
    __esModule: true,
    default: {
      getConfig: jest.fn().mockReturnValue({
        botName: 'botName',
        discord: {
          token: 'mock_token',
          maxHistory: 20,
          lang: 'en'
        },
        aiClient: 'openAI',
        triggerWords: [],
        AIPrompt: 'You are a nice assistant in a discord server',
        openAI: {
          apiKey: 'mock_openai_key',
          model: 'gpt-4o',
          summaryModel: 'gpt-4o-mini',
          imageSize: '1024x1024',
          maxTokens: 4000,
          temperature: 0.5
        },
        claude: {
          apiKey: 'mock_claude_key',
          model: 'claude-3-5-sonnet-20240620',
          summaryModel: 'claude-3-haiku-20240307',
          prompt: 'You are a nice assistant in a discord server',
          maxTokens: 2000,
          temperature: 0.5
        },
        fluxApi: {
          active: false,
          apiKey: 'mock_flux_api_key'
        },
        dallE: {
          active: false,
          apiKey: 'mock_dall_e_key',
          imageSize: '1024x1024'
        }
      }),
      config: {
        botName: 'botName',
        triggerWords: [],
        discord: {
          token: 'mock_token',
          maxHistory: 20,
          lang: 'en'
        },
        fluxApi: {
          active: false,
          apiKey: 'mock_flux_api_key'
        },
        dallE: {
          active: false,
          apiKey: 'mock_dall_e_key',
          imageSize: '1024x1024'
        },
        braveSearch: {
          active: false,
          apiKey: 'mock_brave_search_key'
        },
        coin: {
          active: false,
          apiKey: 'mock_coin_key',
          defaultAsset: 'BTC'
        },
        googleLighthouse: {
          active: false,
          apiKey: 'mock_google_lighthouse_key'
        },
        giphy: {
          active: false,
          apiKey: 'mock_giphy_key'
        },
        tmpFolder: 'mock_tmp_folder',
        lang: 'en',
        dune: {
          active: false,
          apiKey: 'mock_dune_key'
        },
        serp: {
          active: false,
          apiKey: 'mock_serp_key',
          google_domain: 'mock_google_domain',
          lang: 'en',
          gl: 'us',
          hl: 'en'
        },
        googleSearch: {
          active: false,
          apiKey: 'mock_google_search_key',
          cx: 'mock_google_search_cx'
        },
        stability: {
          active: false,
          apiKey: 'mock_stability_key'
        }
      }
    }
  };
});

// Add this import at the top of your test file
jest.mock('@fal-ai/serverless-client', () => ({
  config: jest.fn()
}));

jest.mock('./../../src/clients/ai-client');

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  jest.mock('../../src/configManager');
});

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
        author: 'Ipsum'
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
        author: 'Ipsum'
      };
      const secondMessage = {
        role: 'assistant',
        content: 'second',
        dateTime: '123',
        channelId: 1,
        author: 'Lorem'
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
        author: 'Ipsum'
      };
      const secondMessage = {
        role: 'assistant',
        content: 'second',
        dateTime: '123',
        channelId: 1,
        author: 'Lorem'
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
        author: { username: 'Ipsum' }
      };
      const secondMessage = {
        role: 'assistant',
        content: 'second',
        createdAt: '123',
        channelId: 1,
        author: { username: 'Ipsum' }
      };
      const thirdMessage = {
        role: 'user',
        content: 'third',
        createdAt: '123',
        channelId: 1,
        author: { username: 'LoremIpsum' }
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
      const messages = [
        {
          role: 'user',
          content: 'first',
          createdAt: '123',
          channelId: 1,
          author: { username: 'User1' }
        },
        {
          role: 'assistant',
          content: 'second',
          createdAt: '123',
          channelId: 1,
          author: { username: 'Assistant' }
        },
        {
          role: 'user',
          content: 'third',
          createdAt: '123',
          channelId: 1,
          author: { username: 'User2' }
        },
        {
          role: 'assistant',
          content: 'fourth',
          createdAt: '123',
          channelId: 1,
          author: { username: 'Assistant' }
        },
        {
          role: 'user',
          content: 'fifth',
          createdAt: '123',
          channelId: 1,
          author: { username: 'User3' }
        },
        {
          role: 'assistant',
          content: 'sixth',
          createdAt: '123',
          channelId: 1,
          author: { username: 'Assistant' }
        },
        {
          role: 'user',
          content: 'seventh',
          createdAt: '123',
          channelId: 1,
          author: { username: 'User4' }
        }
      ];

      aiCompletionHandler.addMessageArrayToChannel(messages);

      const result = aiCompletionHandler.getFirstMessagesOfAChannel(2, 1);
      
      // Should return messages before the last 5 messages
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('first');
      expect(result[1].content).toBe('second');
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
        author: { username: 'Ipsum', bot: false }
      };
      const secondDiscordMessage = {
        content: 'second',
        createdAt: '123',
        channelId: 1,
        author: { username: 'Lorem', bot: true }
      };
      aiCompletionHandler.setChannelHistory(1, [
        firstDiscordMessage,
        secondDiscordMessage
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
          channelId: 1
        },
        {
          role: 'user',
          content: '{"author":"Ipsum","content":"first","dateTime":"123"}',
          channelId: 1
        }
      ]);
    });
  });
});
