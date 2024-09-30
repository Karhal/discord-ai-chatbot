/* eslint-disable no-undef */
import ImageHandler from './../../src/handlers/image-handler';
jest.mock('./../../src/clients/ai-client');
jest.mock('./../../src/tools');
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
        tmpFolder: {
          path: 'tmp'
        },
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
it('should download images', async () => {
  const msg = {
    channel: {
      sendTyping: () => {}
    }
  };
  const imgHandler = new ImageHandler(null, msg, '');
  const images = ['https://fr.wikipedia.org/static/images/icons/wikipedia.png'];
  const response = await imgHandler.downloadImages(images);
  expect(response).toHaveLength(1);
  expect(response[0]).toMatch(/(\\|\.?\/?)tmp(\\|\/)\d+.jpg/);
  const fs = require('fs');
  fs.unlinkSync(response[0]);
});

it('should delete images', async () => {
  const discordMessage = {
    channel: {
      sendTyping: () => {}
    }
  };
  const imgHandler = new ImageHandler(null, discordMessage, '');
  const images = ['https://fr.wikipedia.org/static/images/icons/wikipedia.png'];
  imgHandler.downloadedImages = await imgHandler.downloadImages(images);

  imgHandler.deleteImages();
  const fs = require('fs');
  await new Promise((r) => setTimeout(r, 50));
  expect(fs.existsSync(imgHandler.downloadedImages[0])).toBe(false);
});
