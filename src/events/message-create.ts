import AiCompletionHandler from '../handlers/ai-completion-handler';
import EventDiscord from '../clients/events-discord';
import { Collection, Events, Message } from 'discord.js';
import FileHandler from '../handlers/file-handler';
import ConfigManager from '../configManager';

export default class MessageCreate extends EventDiscord {
  eventName: Events = Events.MessageCreate;
  intervalDate: NodeJS.Timeout | null = null;
  message: Message | null = null;
  config = ConfigManager.config;

  handler = async (message: Message): Promise<void> => {
    const maxHistory: number = ConfigManager.config.discord.maxHistory;
    if (
      !this.theMessageContainsBotName(message) ||
      message.author.id === this.discordClient?.user?.id ||
      message.author.bot
    ) {
      return;
    }

    const channelId: string = message.channelId;
    const messagesChannelHistory: Collection<string, Message<boolean>> = await message.channel.messages.fetch({
      limit: maxHistory
    });

    const aiCompletionHandler = new AiCompletionHandler(this.aiClient, this.config.AIPrompt);
    this.setupEventListeners(aiCompletionHandler, message);
    aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);
    const summary = await aiCompletionHandler.getSummary(channelId);

    if (summary) {
      const content = await aiCompletionHandler.getAiCompletion(summary, channelId);
      await this.sendResponse(message, content);
    }
    console.log('Done.');
  };

  async sendResponse(message: Message, response: string): Promise<boolean> {
    response = response.trim().replace(/\n\s*\n/g, '\n');
    if (response) {
      message.channel.send(response);
    }
    const attachmentsPath = FileHandler.getFolderFilenameFullPaths(this.config.tmpFolder.path);
    console.log('Attachments:', attachmentsPath);
    if (attachmentsPath.length > 0) {
      await message.channel.send({ files: [...attachmentsPath] });
      console.log('Attachments sent');
      FileHandler.emptyFolder(this.config.tmpFolder.path);
    }
    return true;
  }

  theMessageContainsBotName(message: Message): boolean {
    const botName = this.discordClient.user?.username;
    const botId = this.discordClient.user?.id;
    if (!!botName || !!botId) {
      return (
        (!!botName && message.content.toLowerCase().includes(botName.toLowerCase())) ||
        (!!botId && message.content.toLowerCase().includes('<@' + botId + '>'))
      );
    }
    return false;
  }

  private setupEventListeners(aiCompletionHandler: AiCompletionHandler, message: Message): void {
    aiCompletionHandler.on('completionRequested', (data) => {
      message.channel.sendTyping();
    });
  }
}
