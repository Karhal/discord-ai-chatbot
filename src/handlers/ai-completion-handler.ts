import { AIClientType } from '../types/AIClientType';
import { Collection, Message } from 'discord.js';
import { MessageInput } from '../types/types';
import { tools } from './../tools-manager';
import ConfigManager, { DiscordConfigType } from '../configManager';
import { EventEmitter } from 'events';
import { MessageFormatter } from '../utils/message-formatter';
import { Logger } from '../utils/logger';
import { AIPromptBuilder } from '../utils/ai-prompt-builder';

export default class AiCompletionHandler extends EventEmitter {
  private messages: MessageInput[] = [];
  private discordConfig: DiscordConfigType;
  private messageFormatter: MessageFormatter;
  private logger: Logger;
  private promptBuilder: AIPromptBuilder;
  private botId: string;

  constructor(
    private aiClient: AIClientType & EventEmitter,
    botId: string
  ) {
    super();
    this.discordConfig = ConfigManager.config.discord;
    this.messageFormatter = new MessageFormatter();
    this.logger = new Logger();
    this.promptBuilder = new AIPromptBuilder(this.discordConfig, ConfigManager.config.AIPrompt);
    this.botId = botId;
  }


  async getAiCompletion(channelId: string): Promise<string> {
    try {
      const systemPrompt = this.promptBuilder.createCompletionPrompt();
      const formattedMessages = this.messageFormatter.formatLastMessages(
        this.getLastMessagesOfAChannel(ConfigManager.config.discord.maxHistory, channelId),
        channelId
      );

      const messages: MessageInput[] = formattedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        channelId: channelId
      }));

      this.logger.debug('AI Completion Request:', { systemPrompt, messages });
      this.emit('completionRequested', { channelId });

      return await this.aiClient.getAiCompletion(systemPrompt, messages, tools);
    }
    catch (error) {
      this.logger.error('Error getting AI completion:', error);
      return 'An error occurred while processing your request.';
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

  getLastMessagesOfAChannel(count: number, channelId: string) {
    if (!this.messages) return [];

    return this.messages.filter((msg) => msg.channelId === channelId).slice(-count);
  }

  getFirstMessagesOfAChannel(count: number, channelId: string) {
    if (!this.messages) return [];

    const channelMessages = this.messages.filter((msg) => msg.channelId === channelId);
    const endIndex = channelMessages.length - count;
    const startIndex = Math.max(0, endIndex - count);

    return channelMessages.slice(startIndex, endIndex);
  }

  setChannelHistory(channelId: string, messages: Collection<string, Message<boolean>>) {
    this.eraseMessagesWithChannelId(channelId);
    const handlerMessages = this.createMessagesArrayFromHistory(messages);
    this.addMessageArrayToChannel(handlerMessages);
  }

  createMessagesArrayFromHistory(messagesChannelHistory: Collection<string, Message<boolean>>) {
    const messages: MessageInput[] = [];
    let currentUserMessages: string[] = [];
    let lastRole: 'user' | 'assistant' | null = null;

    messagesChannelHistory.reverse().forEach((msg: Message) => {
      if (msg.content === '' && msg.attachments.size === 0) return;

      const role = msg.author.id === this.botId ? 'assistant' : 'user';
      const content = msg.content;
      const author = msg.author.username;

      const attachments = msg.attachments.map(attachment => ({
        name: attachment.name,
        url: attachment.url,
        contentType: attachment.contentType || 'application/octet-stream'
      }));

      if (role !== lastRole && lastRole === 'user' && currentUserMessages.length > 0) {
        messages.push({
          role: 'user',
          content: currentUserMessages.join('\n'),
          channelId: msg.channelId
        });
        currentUserMessages = [];
      }

      if (role === 'assistant') {
        messages.push({
          role: 'assistant',
          content: content,
          channelId: msg.channelId,
          attachments: attachments.length > 0 ? attachments : undefined
        });
      }
      else {
        const messageWithAttachments = attachments.length > 0
          ? `${author}: ${content}\n[Pièces jointes: ${attachments.map(a => `${a.name} (${a.url})`).join(', ')}]`
          : `${author}: ${content}`;
        currentUserMessages.push(messageWithAttachments);
      }

      lastRole = role;
    });

    if (currentUserMessages.length > 0) {
      messages.push({
        role: 'user',
        content: currentUserMessages.join('\n'),
        channelId: messagesChannelHistory.first()?.channelId || ''
      });
    }

    messages.forEach((msg, index) => {
      console.log(`\n[Message ${index + 1}]`);
      console.log('Role:', msg.role);
      console.log('Content:', msg.content);
      if (msg.attachments) {
        console.log('Attachments:', msg.attachments.map(a => `${a.name} (${a.url})`).join('\n'));
      }
    });

    return messages;
  }
}
