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
      'Check out these images: ![Rockstar Sheep](https://oaidalleapiprodscus.blob.core.windows.net/private/org-WNrO9cD8TNufdV4A5ebLCcRL/user-Lorem/img-kkzx3kc7SQuaZNs4RDsm6GMA.png?st=2024-08-05T09%3A27%3A21Z&se=2024-08-05T11%3A27%3A21Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-08-05T09%3A24%3A54Z&ske=2024-08-06T09%3A24%3A54Z&sks=b&skv=2023-11-03&sig=mG22afXBwhSO0Z6VuVYApi66HDRgve8u6ErH/sEf38o%3D) and ![Rockstar Sheep](https://oaidalleapiprodscus.blob.core.windows.net/private/org-WNrO9cD8TNufdV4A5ebLCcRL/user-Lorem/img-kkzx3kc7SQuaZNs4RDsm6GMA.png?st=2024-08-05T09%3A27%3A21Z&se=2024-08-05T11%3A27%3A21Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-08-05T09%3A24%3A54Z&ske=2024-08-06T09%3A24%3A54Z&sks=b&skv=2023-11-03&sig=mG22afXBwhSO0Z6VuVYApi66HDRgve8u6ErH/sEf38o%d3D)',
    author: {
      username: 'test'
    },
    attachments: []
  };
  const imgHandler = new ImageHandler(null, discordMessage, '');
  const expected = [
    'https://oaidalleapiprodscus.blob.core.windows.net/private/org-WNrO9cD8TNufdV4A5ebLCcRL/user-Lorem/img-kkzx3kc7SQuaZNs4RDsm6GMA.png?st=2024-08-05T09%3A27%3A21Z&se=2024-08-05T11%3A27%3A21Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-08-05T09%3A24%3A54Z&ske=2024-08-06T09%3A24%3A54Z&sks=b&skv=2023-11-03&sig=mG22afXBwhSO0Z6VuVYApi66HDRgve8u6ErH/sEf38o%3D',
    'https://oaidalleapiprodscus.blob.core.windows.net/private/org-WNrO9cD8TNufdV4A5ebLCcRL/user-Lorem/img-kkzx3kc7SQuaZNs4RDsm6GMA.png?st=2024-08-05T09%3A27%3A21Z&se=2024-08-05T11%3A27%3A21Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-08-05T09%3A24%3A54Z&ske=2024-08-06T09%3A24%3A54Z&sks=b&skv=2023-11-03&sig=mG22afXBwhSO0Z6VuVYApi66HDRgve8u6ErH/sEf38o%d3D'
  ];
  const result = imgHandler.getExtractedImagesUrls(discordMessage.content);
  expect(result).toEqual(expected);
});

test('should return empty array when no image URLs are present', () => {
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
  const result = imgHandler.getExtractedImagesUrls(discordMessage.content);
  expect(result).toBeInstanceOf(Array);
  expect(result).toHaveLength(0);
});

test('cleanImagePathsFromResponse should delete image urls from the content', () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
    },
    content:
      'Lorem Ipsum Woop woop ![Rockstar Sheep](https://oaidalleapiprodscus.blob.core.windows.net/private/org-WNrO9cD8TNufdV4A5ebLCcRL/user-Lorem/img-kkzx3kc7SQuaZNs4RDsm6GMA.png?st=2024-08-05T09%3A27%3A21Z&se=2024-08-05T11%3A27%3A21Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-08-05T09%3A24%3A54Z&ske=2024-08-06T09%3A24%3A54Z&sks=b&skv=2023-11-03&sig=mG22afXBwhSO0Z6VuVYApi66HDRgve8u6ErH/sEf38o%3D)'
  };

  const imgHandler = new ImageHandler(discordMessage);
  const cleanContent = imgHandler.cleanImagePathsFromResponse(
    discordMessage.content
  );
  expect(cleanContent).toBe('Lorem Ipsum Woop woop');
});

it('should return an empty array when no URLs are present', () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
    },
    content: 'This is a test content without any URLs.'
  };
  const imgHandler = new ImageHandler(discordMessage);
  const result = imgHandler.getExtractedImagesUrls(discordMessage.content);
  expect(result).toEqual([]);
});

it('should return an array with URLs from the specified domain', () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
    },
    content:
      'Check this image ![alt text](https://oaidalleapiprodscus.com/image1.png)'
  };
  const imgHandler = new ImageHandler(discordMessage);
  const result = imgHandler.getExtractedImagesUrls(discordMessage.content);
  expect(result).toEqual(['https://oaidalleapiprodscus.com/image1.png']);
});

it('should return an array with multiple URLs from the specified domain', () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
    },
    content:
      '![alt text](https://oaidalleapiprodscus.com/image1.png) and ![another image](https://oaidalleapiprodscus.com/image2.png))'
  };
  const imgHandler = new ImageHandler(discordMessage);
  const result = imgHandler.getExtractedImagesUrls(discordMessage.content);
  expect(result).toEqual([
    'https://oaidalleapiprodscus.com/image1.png',
    'https://oaidalleapiprodscus.com/image2.png'
  ]);
});

it('should ignore URLs from other domains', () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
    },
    content:
      '![alt text](https://oaidalleapiprodscus.com/image1.png) and ![another image](https://otherdomain.com/image2.png)'
  };
  const imgHandler = new ImageHandler(discordMessage);
  const result = imgHandler.getExtractedImagesUrls(discordMessage.content);
  expect(result).toEqual(['https://oaidalleapiprodscus.com/image1.png']);
});

it('should handle mixed content with and without URLs', () => {
  const discordMessage = {
    channel: {
      sendTyping: function() {}
    },
    content:
      'This is a test ![alt text](https://oaidalleapiprodscus.com/image1.png) and some more text.'
  };

  const imgHandler = new ImageHandler(discordMessage);
  const result = imgHandler.getExtractedImagesUrls(discordMessage.content);
  expect(result).toEqual(['https://oaidalleapiprodscus.com/image1.png']);
});
