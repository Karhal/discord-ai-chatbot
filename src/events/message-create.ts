import EventDiscord from '../clients/events-discord';
import { Collection, Events, Message } from 'discord.js';
import FileHandler from '../handlers/file-handler';
import ConfigManager from '../configManager';
import { Client } from 'discord.js';
import { AIClientType } from '../types/AIClientType';
import MetricsService from '../services/metrics-service';

export default class MessageCreate extends EventDiscord {
  eventName: Events = Events.MessageCreate;
  intervalDate: NodeJS.Timeout | null = null;
  message: Message | null = null;
  config = ConfigManager.config;

  constructor(
    public discordClient: Client,
    public aiClient: AIClientType
  ) {
    super(discordClient, aiClient);
    this.setupEventListeners();
  }

  handler = async (message: Message): Promise<void> => {
    try {
      if (this.shouldIgnoreMessage(message)) {
        return;
      }
      this.message = message;
      const channelId = message.channelId;
      const messagesChannelHistory = await this.fetchChannelHistory(message, this.config.discord.maxHistory);
      this.aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);
      const summary = await this.aiCompletionHandler.getSummary(channelId);

      if (summary) {
        const content = await this.aiCompletionHandler.getAiCompletion(summary, channelId);
        await this.sendResponse(message, content);
      }
      console.log('Done.');
    }
    catch (error) {
      console.error('Error handling message:', error);
    }
  };

  async sendResponse(message: Message, response: string): Promise<boolean> {
    response = response.trim().replace(/\n\s*\n/g, '\n');
    if (response) {
      const chunks = this.splitResponseIntoChunks(response, 2000);

      for (const chunk of chunks) {
        await message.channel.send(chunk);
      }

      const metricsService = MetricsService.getInstance();
      const attachmentsPath = FileHandler.getFolderFilenameFullPaths(this.config.tmpFolder.path);
      await metricsService.sendMetrics(
        this.config.discord.token,
        message.author.username,
        false
      );
      for (let i = 0; i < attachmentsPath.length; i++) {
        await metricsService.sendMetrics(
          this.config.discord.token,
          message.author.username,
          true
        );
      }
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

  private async fetchChannelHistory(message: Message, limit: number): Promise<Collection<string, Message<boolean>>> {
    return await message.channel.messages.fetch({ limit });
  }

  private shouldIgnoreMessage(message: Message): boolean {
    return (
      !this.theMessageContainsBotName(message) ||
      message.author.id === this.discordClient?.user?.id ||
      message.author.bot
    );
  }

  private theMessageContainsBotName(message: Message): boolean {
    const botName = this.discordClient.user?.username;
    const botId = this.discordClient.user?.id;
    const triggerWords = ConfigManager.config.triggerWords;
    if (!!botName || !!botId) {
      return (
        (!!botName && message.content.toLowerCase().includes(botName.toLowerCase())) ||
        (!!botId && message.content.toLowerCase().includes('<@' + botId + '>')) ||
        triggerWords.some((word) => message.content.toLowerCase().includes(word.toLowerCase()))
      );
    }
    return false;
  }

  private setupEventListeners(): void {
    this.aiCompletionHandler.on('completionRequested', (data) => {
      if (data && data.channelId) {
        const channel = this.discordClient.channels.cache.get(data.channelId);
        if (channel && channel.isTextBased()) {
          channel.sendTyping();
        }
      } else {
        console.error('ChannelId manquant dans les données de completion');
      }
    });
  }

  private splitResponseIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    const lines = text.split('\n');

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
      else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}
