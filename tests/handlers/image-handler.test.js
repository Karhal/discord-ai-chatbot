/* eslint-disable no-undef */
import ImageHandler from './../../src/handlers/image-handler';
jest.mock('./../../src/clients/ai-client');
jest.mock('./../../src/tools');
jest.mock('./../../src/config', () => {
  return {
    discord: {
      lang: 'fr',
      token: '<discord Token>',
      maxHistory: 10
    },
    openAI: {
      apiKey: '<openAiKey>',
      model: 'gpt-4o',
      summaryModel: 'gpt-4o-mini',
      prompt: '',
      imageSize: '1024x1024'
    },
    dune: {
      active: false,
      apiKey: ''
    },
    serp: {
      active: false,
      apiKey: '',
      lang: ''
    },
    braveSearch: {
      active: false,
      apiKey: '',
      lang: ''
    },
    coin: {
      active: false,
      apiKey: '',
      defaulAsset: 'USD'
    },
    googleLighthouse: {
      active: false,
      apiKey: ''
    },
    googleSearch: {
      active: false,
      apiKey: '',
      cx: ''
    },
    tmpFolder: {
      path: './tmp_test'
    }
  };
});

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
  expect(response[0]).toMatch(/tmp(\\|\/)\d+.jpg/);
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
