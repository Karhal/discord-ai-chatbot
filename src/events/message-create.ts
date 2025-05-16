import EventDiscord from '../clients/events-discord';
import { Collection, Events, Message, TextChannel } from 'discord.js';
import FileHandler from '../handlers/file-handler';
import ConfigManager from '../configManager';
import { Client } from 'discord.js';
import { AIClientType } from '../types/AIClientType';
import { MessageInput } from '../types/types';
import MetricsService from '../services/metrics-service';
import ModerationService from '../services/moderation-service';
import AiCompletionHandler from '../handlers/ai-completion-handler';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export default class MessageCreate extends EventDiscord {

  eventName: Events = Events.MessageCreate;
  intervalDate: NodeJS.Timeout | null = null;
  message: Message | null = null;
  config = ConfigManager.config;
  private moderationService: ModerationService;
  public aiCompletionHandler: AiCompletionHandler;

  constructor(
    public discordClient: Client,
    aiClient: AIClientType & EventEmitter,
    botId: string
  ) {
    super(discordClient, aiClient);
    this.moderationService = ModerationService.getInstance();
    this.aiCompletionHandler = new AiCompletionHandler(
      aiClient,
      botId
    );
    this.setupEventListeners();
  }

  handler = async (message: Message): Promise<void> => {
    try {
      if (ConfigManager.config.moderation.enabled) {
        await this.moderationService.moderateMessage(message);
      }

      if (this.shouldIgnoreMessage(message)) {
        return;
      }
      this.message = message;
      const channelId = message.channelId;

      const triggerMessage: MessageInput = {
        role: 'user',
        content: `${message.author.username}: ${message.content}`,
        channelId: channelId,
        id: message.id,
        attachments: message.attachments?.map(attachment => ({
          name: attachment.name,
          url: attachment.url,
          contentType: attachment.contentType || 'application/octet-stream'
        }))
      };
      this.aiCompletionHandler.setTriggerMessage(triggerMessage);

      const messagesChannelHistory = await this.fetchChannelHistory(message, this.config.discord.maxHistory);
      this.aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);
      const content = await this.aiCompletionHandler.getAiCompletion(channelId);
      await this.sendResponse(message, content);
      console.log('Done.');
    }
    catch (error) {
      console.error('Error in message handler:', error);
    }
  };

  async sendResponse(message: Message, response: string): Promise<boolean> {
    response = response.trim().replace(/\n\s*\n/g, '\n');
    if (!response) {
      return false;
    }

    const chunks = this.splitResponseIntoChunks(response, 2000);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (message.channel instanceof TextChannel) {
        if (i === 0) {
          await message.reply(chunk);
        }
        else {
          await message.channel.send(chunk);
        }
      }
    }

    const metricsService = MetricsService.getInstance();
    const channelId = message.channelId;
    const channelAttachmentsPath = `${this.config.tmpFolder.path}/${channelId}`;
    const folderExists = fs.existsSync(path.join('.', channelAttachmentsPath));
    const attachmentsPath = folderExists
      ? FileHandler.getFolderFilenameFullPaths(channelAttachmentsPath)
      : [];

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

    if (attachmentsPath.length > 0) {
      if (message.channel instanceof TextChannel) {
        await message.channel.send({ files: [...attachmentsPath] });
      }
      console.log('Attachments sent');
      FileHandler.emptyFolder(channelAttachmentsPath);
    }
    return true;
  }

  private async fetchChannelHistory(message: Message, limit: number): Promise<Collection<string, Message<boolean>>> {
    return await message.channel.messages.fetch({ limit: limit, before: message.id });
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

    if (!botName && !botId) {
      return false;
    }

    const contentLower = message.content.toLowerCase();
    const nameMatch = !!botName && contentLower.includes(botName.toLowerCase());
    const idMatch = !!botId && contentLower.includes('<@' + botId + '>');
    const triggerWordMatch = triggerWords.some((word) => contentLower.includes(word.toLowerCase()));

    return nameMatch || idMatch || triggerWordMatch;
  }

  private setupEventListeners(): void {
    this.aiCompletionHandler.on('completionRequested', (data) => {
      if (data && data.channelId) {
        const channel = this.discordClient.channels.cache.get(data.channelId);
        if (channel && channel instanceof TextChannel) {
          channel.sendTyping();
        }
      }
      else {
        console.error('Missing ChannelId in completion data');
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
