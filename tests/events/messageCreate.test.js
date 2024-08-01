import { Events } from 'discord.js';
import messageCreate from '../../events/messageCreate.js';
//import AiCompletionHandler from './../../handlers/AiCompletionHandler.js';
import config from '../config.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { exit } from 'process';

console.log(global.__dirname);
exit
jest.mock('axios');
//jest.mock('fs');
//jest.mock('path');
//jest.mock('./../../handlers/AiCompletionHandler.js');
jest.mock('../../clients/ai-client.js');
jest.mock('../../tools.js');

describe('messageCreate event', () => {
    const mockMessage = {
        content: 'Test message',
        author: { bot: false },
        channelId: '123',
        channel: {
            sendTyping: jest.fn(),
            send: jest.fn(),
            messages: {
                fetch: jest.fn().mockResolvedValue([]),
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not process messages from bots', async () => {
        mockMessage.author.bot = true;
        await messageCreate.execute(mockMessage);
        expect(mockMessage.channel.sendTyping).not.toHaveBeenCalled();
    });

    it('should not process messages without bot name', async () => {
        mockMessage.content = 'Hello';
        await messageCreate.execute(mockMessage);
        expect(mockMessage.channel.sendTyping).not.toHaveBeenCalled();
    });

    it('should process valid messages', async () => {
        mockMessage.content = `Hello ${config.botName}`;
        await messageCreate.execute(mockMessage);
        expect(mockMessage.channel.sendTyping).toHaveBeenCalled();
    });

    it('should download images correctly', async () => {
        const images = ['http://example.com/image1.jpg'];
        axios.get.mockResolvedValue({ data: 'imageData' });
        const result = await messageCreate.downloadImages(images);
        expect(result).toHaveLength(1);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should save image correctly', () => {
        const response = { data: 'imageData' };
        const imagePath = messageCreate.saveImage(response);
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(imagePath).toContain('.jpg');
    });

    it('should clean image paths from response', () => {
        const response = 'Some text [image](https://oaidalleapiprodscus.blob.core.windows.net/image.jpg)';
        const cleanedResponse = messageCreate.cleanImagePathsFromResponse(response);
        expect(cleanedResponse).not.toContain('https://oaidalleapiprodscus.blob.core.windows.net/image.jpg');
    });

    it('should extract image URLs correctly', () => {
        const response = 'Some text with http://example.com/image.jpg';
        const imageUrls = messageCreate.extractImages(response);
        expect(imageUrls).toContain('http://example.com/image.jpg');
    });

    it('should send response correctly', async () => {
        const response = 'Test response';
        const imagePaths = ['/path/to/image.jpg'];
        await messageCreate.sendResponse(mockMessage, response, imagePaths);
        expect(mockMessage.channel.send).toHaveBeenCalledWith(response.trim().replace(/\n\s*\n/g, '\n'));
        expect(mockMessage.channel.send).toHaveBeenCalledWith({ files: imagePaths });
    });

    it('should delete images correctly', () => {
        const imagePaths = ['/path/to/image.jpg'];
        fs.existsSync.mockReturnValue(true);
        messageCreate.deleteImages(imagePaths);
        expect(fs.unlink).toHaveBeenCalled();
    });
});