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
      const messages = this.messageFormatter.formatLastMessages(
        this.getLastMessagesOfAChannel(5, channelId),
        channelId
      );

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

    return this.messages.filter((msg) => msg.channelId === channelId).slice(-5);
  }

  getFirstMessagesOfAChannel(count: number, channelId: string) {
    if (!this.messages) return [];

    const channelMessages = this.messages.filter((msg) => msg.channelId === channelId);
    const endIndex = channelMessages.length - 5;
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

    console.log('\n=== Message History Processing ===');
    messagesChannelHistory.reverse().forEach((msg: Message) => {
      if (msg.content === '') return;

      const role = msg.author.id === this.botId ? 'assistant' : 'user';
      const content = msg.content;
      const author = msg.author.username;

      console.log(`\nProcessing message from ${author}`);
      console.log('Role:', role);
      console.log('Content:', content);

      if (role !== lastRole && lastRole === 'user' && currentUserMessages.length > 0) {
        console.log('\nGrouping user messages:', currentUserMessages);
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
          channelId: msg.channelId
        });
      }
      else {
        currentUserMessages.push(`${author}: ${content}`);
      }

      lastRole = role;
    });

    if (currentUserMessages.length > 0) {
      console.log('\nGrouping remaining user messages:', currentUserMessages);
      messages.push({
        role: 'user',
        content: currentUserMessages.join('\n'),
        channelId: messagesChannelHistory.first()?.channelId || ''
      });
    }

    console.log('\nFinal formatted messages:');
    messages.forEach((msg, index) => {
      console.log(`\n[Message ${index + 1}]`);
      console.log('Role:', msg.role);
      console.log('Content:', msg.content);
    });
    console.log('==============================\n');

    return messages;
  }
}
