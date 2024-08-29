/* eslint-disable no-undef */
import messageCreate from './../../src/events/message-create';

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
