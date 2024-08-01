import ImageHandler from './../../dist/handlers/image-handler.js';
jest.mock('../../dist/clients/ai-client.js');
jest.mock('../../dist/tools.js');

it('should download images', async () => {
    const msg = {
        channel : {
            sendTyping: function(){}
        }
    };
    const imgHandler = new ImageHandler(msg,'');
    const images = ['https://fr.wikipedia.org/static/images/icons/wikipedia.png'];
    const response = await imgHandler.downloadImages(images);
    expect(response).toHaveLength(1);
    expect(response[0]).toMatch(/\/tmp\/\d+.jpg/);
    const fs = require('fs');
    fs.unlinkSync(response[0]);
});

it('should delete images', async () => {
    const msg = {
        channel : {
            sendTyping: function(){}
        }
    };
    const imgHandler = new ImageHandler(msg,'');
    const images = ['https://fr.wikipedia.org/static/images/icons/wikipedia.png'];
    const response = await imgHandler.downloadImages(images);
    imgHandler.deleteImages(response);
    const fs = require('fs');
    await new Promise(r => setTimeout(r, 50));
    expect(fs.existsSync(response[0])).toBe(false);
});