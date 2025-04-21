/* eslint-disable no-undef */
import AiCompletionHandler from './../../src/handlers/ai-completion-handler';
import { Collection } from 'discord.js';

// First, mock ConfigManager with a function that returns the config
jest.mock('../../src/configManager', () => {
  const mockConfig = {
    discord: {
      maxHistory: 20,
      token: 'mock_token',
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
    },
    moderation: {
      enabled: false,
      bannedWords: [],
      actions: {
        timeout: 300,
        maxWarnings: 3
      },
      googleSafeBrowsingKey: 'mock_safe_browsing_key'
    }
  };

  return {
    __esModule: true,
    default: {
      config: mockConfig,
      getConfig: () => mockConfig
    }
  };
});

// Then mock Discord.js Collection
jest.mock('discord.js', () => ({
  Collection: jest.fn().mockImplementation(() => ({
    reverse: jest.fn().mockReturnThis(),
    forEach: jest.fn()
  }))
}));

describe('AiCompletionHandler', () => {
  let mockAiClient;
  const mockBotId = '123456789';

  beforeEach(() => {
    mockAiClient = {
      getAiCompletion: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('Message Management', () => {
    let handler;

    beforeEach(() => {
      handler = new AiCompletionHandler(mockAiClient, mockBotId);
    });

    describe('addMessageToChannel', () => {
      it('should add a message to an empty channel', () => {
        const message = {
          role: 'user',
          content: 'test message',
          channelId: '123'
        };

        handler.addMessageToChannel(message);
        expect(handler.messages).toContainEqual(message);
      });

      it('should respect maxHistory limit', () => {
        const messages = Array.from({ length: 25 }, (_, i) => ({
          role: 'user',
          content: `message ${i}`,
          channelId: '123'
        }));

        messages.forEach(msg => handler.addMessageToChannel(msg, 20));
        const channelMessages = handler.getLastMessagesOfAChannel(25, '123');
        expect(channelMessages).toHaveLength(20);
      });
    });

    describe('getLastMessagesOfAChannel', () => {
      it('should return the last N messages from a channel', () => {
        const messages = [
          { role: 'user', content: 'first', channelId: '123' },
          { role: 'assistant', content: 'second', channelId: '123' },
          { role: 'user', content: 'third', channelId: '123' }
        ];

        messages.forEach(msg => handler.addMessageToChannel(msg));
        const lastTwo = handler.getLastMessagesOfAChannel(2, '123');
        
        expect(lastTwo).toHaveLength(2);
        expect(lastTwo[1].content).toBe('third');
      });

      it('should return empty array for non-existent channel', () => {
        const messages = handler.getLastMessagesOfAChannel(5, 'non-existent');
        expect(messages).toEqual([]);
      });
    });
  });

  describe('Discord Message Conversion', () => {
    let handler;

    beforeEach(() => {
      handler = new AiCompletionHandler(mockAiClient, mockBotId);
    });

    it('should convert Discord messages to MessageInput format', () => {
      // Create a mock Discord Collection
      const mockMessages = [
        {
          id: 'msg1',
          content: 'Hello',
          author: { username: 'User1', id: '987654321' },
          channelId: '123',
          attachments: {
            size: 0,
            map: () => []
          }
        },
        {
          id: 'msg2',
          content: 'Hi there',
          author: { username: 'Bot', id: mockBotId },
          channelId: '123',
          attachments: {
            size: 0,
            map: () => []
          }
        }
      ];

      // Create a mock Collection that behaves like Discord.js Collection
      const mockCollection = {
        reverse: () => mockCollection,
        forEach: (callback) => mockMessages.forEach(callback)
      };

      const result = handler.convertDiscordMessagesToInput(mockCollection);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        role: 'user',
        content: 'User1: Hello',
        channelId: '123',
        id: 'msg1'
      });
      expect(result[1]).toEqual({
        role: 'assistant',
        content: 'Hi there',
        channelId: '123',
        id: 'msg2'
      });
    });

    it('should handle messages with attachments', () => {
      const mockMessages = [
        {
          id: 'msg1',
          content: 'Check this out',
          author: { username: 'User1', id: '987654321' },
          channelId: '123',
          attachments: {
            size: 1,
            map: () => [{
              name: 'image.png',
              url: 'http://example.com/image.png',
              contentType: 'image/png'
            }]
          }
        }
      ];

      const mockCollection = {
        reverse: () => mockCollection,
        forEach: (callback) => mockMessages.forEach(callback)
      };

      const result = handler.convertDiscordMessagesToInput(mockCollection);

      expect(result[0]).toEqual({
        role: 'user',
        content: 'User1: Check this out\n[Attachements: image.png (http://example.com/image.png)]',
        channelId: '123',
        id: 'msg1'
      });
    });
  });

  describe('Message Array Handling', () => {
    let handler;

    beforeEach(() => {
      handler = new AiCompletionHandler(mockAiClient, mockBotId);
    });

    it('should handle existing MessageInput arrays', () => {
      const messages = [
        {
          role: 'user',
          content: 'Hello',
          channelId: '123',
          id: 'msg1'
        },
        {
          role: 'assistant',
          content: 'Hi there',
          channelId: '123',
          id: 'msg2'
        }
      ];

      const result = handler.createMessagesArrayFromHistory(messages);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(messages[0]);
      expect(result[1]).toEqual(messages[1]);
    });
  });
});
