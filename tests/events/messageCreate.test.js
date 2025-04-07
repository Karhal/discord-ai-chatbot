/* eslint-disable no-undef */
import messageCreate from './../../src/events/message-create';
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
          imageSize: '1024x1024',
          maxTokens: 4000,
          temperature: 0.5
        },
        claude: {
          apiKey: 'mock_claude_key',
          model: 'claude-3-5-sonnet-20240620',
          prompt: 'You are a nice assistant in a discord server',
          maxTokens: 2000,
          temperature: 0.5
        },
        moderation: {
          enabled: false,
          bannedWords: [],
          actions: {
            timeout: 300,
            maxWarnings: 3
          },
          googleSafeBrowsingKey: 'mock_safe_browsing_key'
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
        moderation: {
          enabled: false,
          bannedWords: [],
          actions: {
            timeout: 300,
            maxWarnings: 3
          },
          googleSafeBrowsingKey: 'mock_safe_browsing_key'
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

// Add this import at the top of your test file
jest.mock('@fal-ai/serverless-client', () => ({
  config: jest.fn()
}));

describe('messageCreate event', () => {
  const mockMessage = {
    content: 'Test message',
    author: { bot: false },
    channelId: '123',
    channel: {
      sendTyping: jest.fn(),
      send: jest.fn(),
      messages: {
        fetch: jest.fn().mockResolvedValue([])
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the ConfigManager mock before each test if needed
    jest.resetModules();
    jest.mock('../../src/configManager');
  });

  const mockDiscordClient = {
    user: {
      id: '9999999999',
      username: 'botName'
    }
  };

  it('should not process messages from bots', async () => {
    mockMessage.author.bot = true;
    const messageEvent = new messageCreate();
    messageEvent.discordClient = mockDiscordClient;
    await messageEvent.handler(mockMessage);
    expect(mockMessage.channel.sendTyping).not.toHaveBeenCalled();
  });

  it('should not process messages that do not contain the bot name and bot is not tagged', async () => {
    mockMessage.content = 'Test message';
    const messageEvent = new messageCreate();
    messageEvent.discordClient = mockDiscordClient;
    const response = await messageEvent.theMessageContainsBotName(mockMessage);
    expect(response).toBe(false);
  });

  it('should process messages that contain the bot name', async () => {
    mockMessage.content = 'Test message ' + mockDiscordClient.user.username;
    const messageEvent = new messageCreate();
    messageEvent.discordClient = mockDiscordClient;
    const response = await messageEvent.theMessageContainsBotName(mockMessage);
    expect(response).toBe(true);
  });

  it('should process messages that contain the bot id', async () => {
    mockMessage.content = 'Test message <@' + mockDiscordClient.user.id + '>';
    const messageEvent = new messageCreate();
    messageEvent.discordClient = mockDiscordClient;
    const response = await messageEvent.theMessageContainsBotName(mockMessage);
    expect(response).toBe(true);
  });
});
