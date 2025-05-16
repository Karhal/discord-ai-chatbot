import { AIClientType } from '../types/AIClientType';
import { Collection, Message } from 'discord.js';
import { MessageInput } from '../types/types';
import { tools } from './../tools-manager';
import ConfigManager, { DiscordConfigType } from '../configManager';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { AIPromptBuilder } from '../utils/ai-prompt-builder';

export default class AiCompletionHandler extends EventEmitter {
  private messages: MessageInput[] = [];
  private discordConfig: DiscordConfigType;
  private logger: Logger;
  private promptBuilder: AIPromptBuilder;
  private botId: string;
  private triggerMessage: MessageInput | null = null;

  constructor(
    private aiClient: AIClientType & EventEmitter,
    botId: string
  ) {
    super();
    this.discordConfig = ConfigManager.config.discord;
    this.logger = new Logger();
    this.promptBuilder = new AIPromptBuilder(ConfigManager.config.AIPrompt);
    this.botId = botId;
  }

  setTriggerMessage(message: MessageInput) {
    let content = message.content || '';

    if (message.attachments && message.attachments.length > 0) {
      const attachmentText = `\n[Attachements: ${message.attachments.map(a => `${a.name} (${a.url})`).join(', ')}]`;
      content = content.trim() + attachmentText;
    }

    this.triggerMessage = {
      ...message,
      content,
      id: message.id || Date.now().toString()
    };

  }

  async getAiCompletion(channelId: string): Promise<string> {
    try {
      const systemPrompt = this.promptBuilder.createCompletionPrompt();
      const messages = this.getLastMessagesOfAChannel(ConfigManager.config.discord.maxHistory, channelId);
      const formattedMessages = this.createMessagesArrayFromHistory(messages);
      const apiMessages = this.prepareMessagesForApi(formattedMessages);
      this.logger.debug('AI Completion Request:', { systemPrompt, messages: apiMessages });
      this.emit('completionRequested', { channelId });

      return await this.aiClient.getAiCompletion(systemPrompt, apiMessages, tools);
    }
    catch (error) {
      this.logger.error('Error getting AI completion:', error);
      return '';
    }
  }

  addMessageToChannel(message: MessageInput, limit = this.discordConfig.maxHistory) {
    if (this.messages) {
      const channelMessages = this.messages.filter((msg) => msg.channelId === message.channelId);

      channelMessages.push(message);
      if (limit) {
        const numLimit = parseInt(limit.toString());
        if (channelMessages.length > numLimit) {
          channelMessages.shift();
        }
      }
      this.messages = this.messages.filter((msg) => msg.channelId !== message.channelId);
      this.messages = [...channelMessages, ...this.messages];
    }
  }

  addMessageArrayToChannel(messages: Array<MessageInput>, limit = this.discordConfig.maxHistory) {
    messages.forEach((message) => {
      this.addMessageToChannel(message, limit);
    });
  }

  eraseMessagesWithChannelId(channelId: string) {
    if (this.messages) {
      this.messages = this.messages.filter((msg) => msg.channelId !== channelId);
    }
  }

  getLastMessagesOfAChannel(count: number, channelId: string): MessageInput[] {
    if (!this.messages) return [];
    return this.messages
      .filter(msg => msg.channelId === channelId)
      .slice(-count);
  }

  getFirstMessagesOfAChannel(count: number, channelId: string) {
    if (!this.messages) return [];

    const channelMessages = this.messages.filter((msg) => msg.channelId === channelId);
    return channelMessages.slice(0, count);
  }

  setChannelHistory(channelId: string, messages: Collection<string, Message<boolean>>) {
    this.eraseMessagesWithChannelId(channelId);
    const handlerMessages = this.convertDiscordMessagesToInput(messages);
    this.addMessageArrayToChannel(handlerMessages);
  }

  private convertDiscordMessagesToInput(messages: Collection<string, Message<boolean>>): MessageInput[] {
    const result: MessageInput[] = [];

    messages.reverse().forEach((msg: Message) => {
      const attachments = msg.attachments?.map(attachment => ({
        name: attachment.name,
        url: attachment.url,
        contentType: attachment.contentType || 'application/octet-stream'
      })) || [];

      const hasContent = msg.content.trim().length > 0;
      const hasAttachments = attachments.length > 0;

      if (!hasContent && !hasAttachments) return;

      const role = msg.author.id === this.botId ? 'assistant' : 'user';
      const content = msg.content;
      const author = msg.author.username;

      if (role === 'assistant') {
        const assistantContent = hasAttachments
          ? attachments.map(a => a.url).join('\\n')
          : content;
        if (assistantContent.trim().length > 0) {
          result.push({
            role: 'assistant',
            content: assistantContent,
            channelId: msg.channelId,
            id: msg.id,
            attachments: hasAttachments ? attachments : undefined
          });
        }
      }
      else {
        const messageWithAttachments = hasAttachments
          ? `${author}: ${content || ''}\n[Attachements: ${attachments.map(a => `${a.name} (${a.url})`).join(', ')}]`
          : `${author}: ${content}`;
        if (messageWithAttachments.trim().length > 0) {
          result.push({
            role: 'user',
            content: messageWithAttachments,
            channelId: msg.channelId,
            id: msg.id
          });
        }
      }
    });

    return result;
  }

  createMessagesArrayFromHistory(messages: MessageInput[]): MessageInput[] {
    console.log('\n[Messages from History]');
    const result: MessageInput[] = [];

    messages.forEach((msg, index) => {
      console.log(`Message ${index + 1}: ${msg.role}, Content: ${msg.content.substring(0, 50)}...`);
      result.push({
        role: msg.role,
        content: msg.content,
        channelId: msg.channelId,
        id: msg.id,
        attachments: msg.attachments
      });
    });

    return result;
  }

  private prepareMessagesForApi(messages: MessageInput[]): MessageInput[] {

    const historyMessages = [...messages];

    if (this.triggerMessage) {
      historyMessages.push(this.triggerMessage);
    }

    return historyMessages;
  }
}
