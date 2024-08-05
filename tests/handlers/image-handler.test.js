/* eslint-disable no-undef */
import ImageHandler from './../../src/handlers/image-handler';
jest.mock('./../../src/clients/ai-client');
jest.mock('./../../src/tools');

it('should download images', async () => {
  const msg = {
    channel: {
      sendTyping: function() {}
    }
  };
  const imgHandler = new ImageHandler(null, msg, '');
  const images = ['https://fr.wikipedia.org/static/images/icons/wikipedia.png'];
  const response = await imgHandler.downloadImages(images);
  expect(response).toHaveLength(1);
  expect(response[0]).toMatch(/\/tmp\/\d+.jpg/);
  const fs = require('fs');
  fs.unlinkSync(response[0]);
});

it('should delete images', async () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
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

test('should extract multiple image URLs from content', () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
    },
    content:
      'Check out these images: https://example.com/image1.jpg and https://example.com/image2.png',
    author: {
      username: 'test'
    },
    attachments: []
  };
  const imgHandler = new ImageHandler(null, discordMessage, '');
  const content =
    'Check out these images: https://example.com/image1.jpg and https://example.com/image2.png';
  const expected = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.png'
  ];
  const result = imgHandler.getExtractedImagesUrls(content);
  expect(result).toEqual(expected);
});

test('should return null when no image URLs are present', () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
    },
    content: 'There is nothign here.',
    author: {
      username: 'test'
    },
    attachments: []
  };
  const imgHandler = new ImageHandler(discordMessage);
  const content = 'There are no images here.';
  const result = imgHandler.getExtractedImagesUrls(content);
  expect(result).toBeNull();
});

test('should delete invalid urls from the content', () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
    },
    content:
      'Check out these images: https://example.com/image1.jpg and https://example.com/image2.png'
  };
  const completion =
    'Lorem Ipsum Woop woop' +
    '![Rockstar Sheep](https://oaidalleapiprodscus.blob.core.windows.net/private/org-WNrO9cD8TNufdV4A5ebLCcRL/user-EOZ4jMyp3NQ37vc9gXp0utFl/img-kkzx3kc7SQuaZNs4RDsm6GMA.png?st=2024-08-05T09%3A27%3A21Z&se=2024-08-05T11%3A27%3A21Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-08-05T09%3A24%3A54Z&ske=2024-08-06T09%3A24%3A54Z&sks=b&skv=2023-11-03&sig=mG22afXBwhSO0Z6VuVYApi66HDRgve8u6ErH/sEf38o%3D)';
  const imgHandler = new ImageHandler(discordMessage);
  const cleanContent = imgHandler.cleanImagePathsFromResponse(completion);
  expect(cleanContent).toBe('Lorem Ipsum Woop woop');
});
