import AiCompletionHandler from '../handlers/ai-completion-handler';
import { tools } from '../tools';
import ConfigManager from '../configManager';
import EventDiscord from '../clients/events-discord';
import { Collection, Events, Message } from 'discord.js';
import FileHandler from '../handlers/file-handler';

export default class MessageCreate extends EventDiscord {
  eventName: Events = Events.MessageCreate;
  intervalDate: NodeJS.Timeout | null = null;
  message: Message | null = null;

  sendTyping = (message: Message) => {
    if (this.intervalDate) {
      this.endTyping();
    }
    this.message = message;
    this.message.channel.sendTyping();
    this.intervalDate = setInterval(() => {
      if (this.message) {
        this.message.channel.sendTyping();
      }
    }, 4500);
  };

  endTyping = () => {
    if (this.intervalDate) clearInterval(this.intervalDate);
    if (this.message) {
      this.message = null;
    }
  };

  handler = async (message: Message): Promise<void> => {
    const maxHistory: number = ConfigManager.config.discord.maxHistory;
    if (
      !this.theMessageContainsBotName(message) ||
      message.author.id === this.discordClient?.user?.id
    ) {
      return;
    }

    this.sendTyping(message);

    const channelId: string = message.channelId;
    const messagesChannelHistory: Collection<
      string,
      Message<boolean>
    > = await message.channel.messages.fetch({
      limit: maxHistory
    });

    const aiCompletionHandler = new AiCompletionHandler(
      this.aiClient,
      ConfigManager.config.openAI.prompt,
      tools
    );

    aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);

    const summary = await aiCompletionHandler.getSummary(channelId);
    if (summary) {
      const content = await aiCompletionHandler.getAiCompletion(
        summary,
        channelId
      );

      await this.sendResponse(message, content);
    }

    this.endTyping();
    console.log('Done.');
  };

  async sendResponse(message: Message, response: string): Promise<boolean> {
    response = response.trim().replace(/\n\s*\n/g, '\n');
    if (response) {
      message.channel.send(response);
    }
    const attachmentsPath = FileHandler.getFolderFilenameFullPaths(
      ConfigManager.config.tmpFolder.path
    );
    console.log('Attachments:', attachmentsPath);
    if (attachmentsPath.length > 0) {
      await message.channel.send({ files: [...attachmentsPath] });
      console.log('Attachments sent');
      FileHandler.emptyFolder(ConfigManager.config.tmpFolder.path);
    }
    return true;
  }

  theMessageContainsBotName(message: Message): boolean {
    const botName = this.discordClient.user?.username;
    const botId = this.discordClient.user?.id;
    if (!!botName || !!botId) {
      return (
        (!!botName &&
          message.content.toLowerCase().includes(botName.toLowerCase())) ||
        (!!botId && message.content.toLowerCase().includes('<@' + botId + '>'))
      );
    }
    return false;
  }
}
