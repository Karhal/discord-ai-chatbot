/* eslint-disable no-undef */
import ImageHandler from './../../src/handlers/image-handler';
jest.mock('./../../src/clients/ai-client');
jest.mock('./../../src/tools');

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
