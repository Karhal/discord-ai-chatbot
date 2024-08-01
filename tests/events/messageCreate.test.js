import messageCreate from '../../dist/events/message-create.js';

//mock config 
jest.mock('../../dist/config.js', () => {
    return {
        discord : {
            lang : "fr",
            token : "<discord Token>",
            botName: "botName",
            maxHistory: 10
        },
        openAI : {
            apiKey : "<openAiKey>",
            model : "gpt-4o",
            summaryModel: "gpt-4o-mini",
            prompt: "",
            imageSize: "1024x1024"
        },
        dune : {
            apiKey : ""
        },
        serp : {
            apiKey : "",
            lang : ""
        },
        braveSearch : {
            apiKey : "",
            lang : ""
        },
        coin : {
            apiKey : "",
            defaulAsset : "USD"
        }
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
});