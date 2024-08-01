import messageCreate from '../../events/messageCreate.js';

//mock config
jest.mock('../../config.js', () => {
    return {
        lang: "fr",
        discordToken: "<discord Token>",
        openaiKey: "<openAiKey>",
        openAiModel: "gpt-4o",
        openAiSummaryModel: "gpt-4o-mini",
        prompt: "",
        botName: "botName",
        imageSize: "1024x1024",
        maxHistory: 10,
        duneApiKey: "",
        serpApiKey: "",
        serpApiLang: "",
        braveSearchApiKey: "-Yb8dwYhyXza79he3w",
        braveSearchApiLang: "",
        coinApiKey: "",
        defaultAsset: "USD"
    };
});

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

    it('should not process messages from bots', async () => {
        mockMessage.author.bot = true;
        const messageEvent = new messageCreate();
        await messageEvent.handler(mockMessage);
        expect(mockMessage.channel.sendTyping).not.toHaveBeenCalled();
    });

    it('should not process messages that do not contain the bot name', async () => {
        mockMessage.content = 'Test message';
        const messageEvent = new messageCreate();
        const response = await messageEvent.theMessageContainsBotName(mockMessage);
        expect(response).toBe(false);    
    });

    it('should process messages that contain the bot name', async () => {
        mockMessage.content = 'Test message botName';
        const messageEvent = new messageCreate();
        const response = await messageEvent.theMessageContainsBotName(mockMessage);
        expect(response).toBe(true);    
    });

    it('should download images', async () => {
        const messageEvent = new messageCreate();
        const images = ['https://fr.wikipedia.org/static/images/icons/wikipedia.png'];
        const response = await messageEvent.downloadImages(images);
        expect(response).toHaveLength(1);
        expect(response[0]).toMatch(/\/tmp\/\d+.jpg/);
        const fs = require('fs');
        fs.unlinkSync(response[0]);
    });

    it('should delete images', async () => {
        const messageEvent = new messageCreate();
        const images = ['https://fr.wikipedia.org/static/images/icons/wikipedia.png'];
        const response = await messageEvent.downloadImages(images);
        messageEvent.deleteImages(response);
        const fs = require('fs');
        await new Promise(r => setTimeout(r, 50));
        expect(fs.existsSync(response[0])).toBe(false);
    });
});