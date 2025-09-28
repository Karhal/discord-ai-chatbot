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
import { Logger } from '../utils/logger';

export default class MessageCreate extends EventDiscord {

  eventName: Events = Events.MessageCreate;
  intervalDate: ReturnType<typeof setTimeout> | null = null;
  message: Message | null = null;
  config = ConfigManager.config;
  private moderationService: ModerationService;
  public aiCompletionHandler: AiCompletionHandler;
  private logger: Logger = new Logger('info');
  private static channelQueues: Map<string, Promise<void>> = new Map();

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
        if (message.deleted) {
          return;
        }
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
        attachments: message.attachments?.map((attachment: any) => ({
          name: attachment.name,
          url: attachment.url,
          contentType: attachment.contentType || 'application/octet-stream'
        }))
      };
      this.aiCompletionHandler.setTriggerMessage(triggerMessage);

      const messagesChannelHistory = await this.fetchChannelHistory(message, this.config.discord.maxHistory);
      this.aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);
      const stopTyping = this.startTypingLoop(message);
      const content = await this.aiCompletionHandler.getAiCompletion(channelId);
      await this.sendResponse(message, content);
      stopTyping();
      this.logger.info('Response sent.', { channelId });
    }
    catch (error) {
      this.logger.error('Error in message handler:', error);
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
        await this.enqueueSend(message.channelId, async () => {
          if (i === 0) {
            try {
              await message.reply({ content: chunk, allowedMentions: { parse: [], repliedUser: true } });
            }
            catch (err) {
              await message.channel.send({ content: chunk, allowedMentions: { parse: [] } });
            }
          }
          else {
            await message.channel.send({ content: chunk, allowedMentions: { parse: [] } });
          }
        });
        if (i > 0) {
          await this.sleep(300);
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
        await this.enqueueSend(message.channelId, async () => {
          await message.channel.send({ files: [...attachmentsPath], allowedMentions: { parse: [] } });
        });
      }
      this.logger.info('Attachments sent', { count: attachmentsPath.length, channelId });
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
    const botId = this.discordClient.user?.id;
    const contentLower = message.content.toLowerCase();
    const triggerWords = (this.config.triggerWords || []);
    const configuredName = (this.config.discord.botName || (this.config as any).botName)?.toLowerCase();

    const mentionByObject = !!botId && message.mentions?.users?.has(botId);
    const mentionByText = !!botId && new RegExp(`<@!?${botId}>`).test(message.content);
    const mentionMatch = Boolean(mentionByObject || mentionByText);
    const botNameMatch = !!configuredName && contentLower.includes(configuredName);
    const triggerWordMatch = triggerWords.some((word) => contentLower.includes(String(word).toLowerCase()));

    return mentionMatch || botNameMatch || triggerWordMatch;
  }

  private setupEventListeners(): void {
    (this.aiCompletionHandler as any).on('completionRequested', (data: { channelId?: string }) => {
      if (data && data.channelId) {
        const channel = this.discordClient.channels.cache.get(data.channelId);
        if (channel && channel instanceof TextChannel) {
          channel.sendTyping();
        }
      }
      else {
        this.logger.warn('Missing ChannelId in completion data');
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

  private async enqueueSend(channelId: string, task: () => Promise<void>): Promise<void> {
    const prev = MessageCreate.channelQueues.get(channelId) || Promise.resolve();
    const next = prev.then(task).catch((err) => {
      this.logger.error('Channel send failed', { channelId, err });
    });
    MessageCreate.channelQueues.set(channelId, next);
    await next;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startTypingLoop(message: Message): () => void {
    try {
      if (message.channel instanceof TextChannel) {
        message.channel.sendTyping();
        const interval = setInterval(() => {
          message.channel.sendTyping();
        }, 8000);
        return () => clearInterval(interval);
      }
    }
    catch (e) {
      this.logger.warn('Failed to start typing loop');
    }
    return () => {};
  }
}
