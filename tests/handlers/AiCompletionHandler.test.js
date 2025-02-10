/* eslint-disable no-undef */
import AiCompletionHandler from './../../src/handlers/ai-completion-handler';

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
        },
        youtubeTranscript: {
          active: false
        },
        puppeteer: {
          active: false
        }
      }
    }
  };
});

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
  let mockAiClient;
  const mockPrompt = 'Test prompt';

  beforeEach(() => {
    mockAiClient = {
      getSummary: jest.fn(),
      getAiCompletion: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    };
  });

  describe('addMessageToChannel', () => {
    it('should add a message to an empty channel', () => {
      const aiCompletionHandler = new AiCompletionHandler(mockAiClient, mockPrompt);
      const message = {
        role: 'user',
        content: 'test message',
        channelId: '2'
      };

      aiCompletionHandler.addMessageToChannel(message);
      expect(aiCompletionHandler.messages).toContain(message);
    });

    it('should remove the oldest message when exceeding maxHistory', () => {
      const aiCompletionHandler = new AiCompletionHandler(mockAiClient, mockPrompt);
      const firstMessage = {
        role: 'user',
        content: 'first',
        channelId: '1'
      };
      const secondMessage = {
        role: 'assistant',
        content: 'second',
        channelId: '1'
      };

      aiCompletionHandler.addMessageToChannel(firstMessage, 1);
      aiCompletionHandler.addMessageToChannel(secondMessage, 1);

      expect(aiCompletionHandler.messages.filter((msg) => msg.channelId === '1').length).toBe(1);
      expect(aiCompletionHandler.messages.filter((msg) => msg.channelId === '1')).not.toContain(firstMessage);
      expect(aiCompletionHandler.messages.filter((msg) => msg.channelId === '1')).toContain(secondMessage);
    });

    it('should add an array of messages to the messages array', () => {
      const aiCompletionHandler = new AiCompletionHandler(mockAiClient, mockPrompt);
      const messages = [
        {
          role: 'user',
          content: 'first',
          channelId: '1'
        },
        {
          role: 'assistant',
          content: 'second',
          channelId: '1'
        }
      ];

      aiCompletionHandler.addMessageArrayToChannel(messages, 2);

      expect(aiCompletionHandler.messages.filter((msg) => msg.channelId === '1').length).toBe(2);
      expect(aiCompletionHandler.messages).toEqual(expect.arrayContaining(messages));
    });

    it('should get the last messages of a given channel', () => {
      const aiCompletionHandler = new AiCompletionHandler(mockAiClient, mockPrompt);
      const messages = [
        {
          role: 'user',
          content: 'first',
          channelId: '1'
        },
        {
          role: 'assistant',
          content: 'second',
          channelId: '1'
        },
        {
          role: 'user',
          content: 'third',
          channelId: '1'
        },
        {
          role: 'assistant',
          content: 'fourth',
          channelId: '1'
        },
        {
          role: 'user',
          content: 'fifth',
          channelId: '1'
        }
      ];

      aiCompletionHandler.addMessageArrayToChannel(messages);

      const lastMessages = aiCompletionHandler.getLastMessagesOfAChannel(5, '1');
      expect(lastMessages).toHaveLength(5);
      expect(lastMessages[lastMessages.length - 1].content).toBe('fifth');
    });

    it('should get the first messages of a given channel', () => {
      const aiCompletionHandler = new AiCompletionHandler(mockAiClient, mockPrompt);
      const messages = [
        {
          role: 'user',
          content: 'first',
          channelId: '1'
        },
        {
          role: 'assistant',
          content: 'second',
          channelId: '1'
        },
        {
          role: 'user',
          content: 'third',
          channelId: '1'
        },
        {
          role: 'assistant',
          content: 'fourth',
          channelId: '1'
        },
        {
          role: 'user',
          content: 'fifth',
          channelId: '1'
        },
        {
          role: 'assistant',
          content: 'sixth',
          channelId: '1'
        },
        {
          role: 'user',
          content: 'seventh',
          channelId: '1'
        }
      ];

      aiCompletionHandler.addMessageArrayToChannel(messages);

      const firstMessages = aiCompletionHandler.getFirstMessagesOfAChannel(2, '1');
      expect(firstMessages).toHaveLength(2);
      expect(firstMessages[0].content).toBe('first');
      expect(firstMessages[1].content).toBe('second');
    });
  });

  describe('createMessagesArrayFromHistory', () => {
    it('should format discord messages into MessageInput array', () => {
      const aiCompletionHandler = new AiCompletionHandler(mockAiClient, mockPrompt);
      const mockCollection = {
        reverse: () => mockCollection,
        forEach: function(callback) {
          [
            {
              content: 'Hello',
              author: { username: 'User1', bot: false },
              channelId: '123'
            },
            {
              content: 'Hi there',
              author: { username: 'Bot', bot: true },
              channelId: '123'
            }
          ].forEach(callback);
        },
        first: () => ({
          channelId: '123'
        })
      };

      const result = aiCompletionHandler.createMessagesArrayFromHistory(mockCollection);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        role: 'user',
        content: 'User1: Hello',
        channelId: '123'
      });
      expect(result[1]).toEqual({
        role: 'assistant',
        content: 'Hi there',
        channelId: '123'
      });
    });
  });
});
