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
    this.triggerMessage = {
      ...message,
      id: message.id || Date.now().toString()
    };
    console.log(`Set trigger message with ID: ${this.triggerMessage.id}`);
  }

  async getAiCompletion(channelId: string): Promise<string> {
    try {
      const systemPrompt = this.promptBuilder.createCompletionPrompt();
      console.log('\n[System Prompt]');
      console.log(systemPrompt);

      const messages = this.getLastMessagesOfAChannel(ConfigManager.config.discord.maxHistory, channelId);
      const formattedMessages = this.createMessagesArrayFromHistory(messages);

      console.log('\n[Before API preparation]');
      console.log('Number of messages:', formattedMessages.length);
      formattedMessages.forEach(msg => {
        console.log(`Message ID: ${msg.id}, Content: ${msg.content.substring(0, 50)}...`);
      });

      const triggerId = this.triggerMessage?.id;

      const apiMessages = this.prepareMessagesForApi(formattedMessages);

      console.log('\n[After API preparation]');
      console.log('Number of messages:', apiMessages.length);
      console.log(`Original trigger ID: ${triggerId}`);
      apiMessages.forEach(msg => {
        console.log(`Message ID: ${msg.id}, Content: ${msg.content.substring(0, 50)}...`);
      });

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

    console.log('\n[Converting Discord messages to input]');
    console.log('Trigger message ID:', this.triggerMessage?.id);

    messages.reverse().forEach((msg: Message) => {
      if (this.triggerMessage && msg.id === this.triggerMessage.id) {
        console.log('Skipping trigger message from history:', msg.id);
        return;
      }

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
          ? attachments.map(a => a.url).join('\n')
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
          ? `${author}: ${content || ''}\n[Pièces jointes: ${attachments.map(a => `${a.name} (${a.url})`).join(', ')}]`
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

    console.log('\n[Discord Messages to Input]');
    console.log('Number of converted messages:', result.length);
    result.forEach((msg, index) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log('ID:', msg.id);
      console.log('Role:', msg.role);
      console.log('Content:', msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''));
      if (msg.attachments) {
        console.log('Attachments:', msg.attachments.length);
      }
    });

    return result;
  }

  createMessagesArrayFromHistory(messages: MessageInput[]): MessageInput[] {
    console.log('\n[Messages from History]');
    const result: MessageInput[] = [];
    
    messages.forEach((msg, index) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log('Role:', msg.role);
      console.log('Content:', msg.content);
      if (msg.attachments) {
        console.log('Attachments:', msg.attachments.map(a => `${a.name} (${a.url})`).join('\n'));
      }
      
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
    console.log('\n[Preparing Messages for API]');
    console.log('Initial messages:', messages.length);

    const messagesWithoutTrigger = this.triggerMessage
      ? messages.filter(msg => msg.id !== this.triggerMessage?.id)
      : [...messages];

    console.log('\nMessages without trigger:', messagesWithoutTrigger.length);

    const result: MessageInput[] = [];

    let currentUserMessage: MessageInput | null = null;
    let currentAssistantMessage: MessageInput | null = null;

    for (const msg of messagesWithoutTrigger) {
      if (msg.role === 'assistant') {
        if (currentUserMessage) {
          result.push(currentUserMessage);
          currentUserMessage = null;
        }

        if (!currentAssistantMessage) {
          currentAssistantMessage = { ...msg };
        }
        else {
          currentAssistantMessage.content += '\n' + msg.content;
        }
      }
      else {

        if (currentAssistantMessage) {
          result.push(currentAssistantMessage);
          currentAssistantMessage = null;
        }

        if (!currentUserMessage) {
          currentUserMessage = { ...msg };
        }
        else {

          currentUserMessage.content += '\n' + msg.content;
        }
      }
    }

    if (currentUserMessage) {
      result.push(currentUserMessage);
    }
    if (currentAssistantMessage) {
      result.push(currentAssistantMessage);
    }

    console.log('\nProcessed messages before adding trigger:', result.length);
    result.forEach((msg, i) => {
      console.log(`Message ${i+1}: ${msg.role}, ID: ${msg.id || 'none'}, Content: ${msg.content.substring(0, 30)}...`);
    });

    if (this.triggerMessage) {

      let username = '';
      for (const msg of messages) {
        const match = msg.content.match(/^([^:]+):/);
        if (match) {
          username = match[1];
          break;
        }
      }

      const triggerContent = this.triggerMessage.content;
      const hasPrefix = triggerContent.includes(':');
      const finalContent = hasPrefix ? triggerContent : username ? `${username}: ${triggerContent}` : triggerContent;

      console.log('\nAdding trigger message:', finalContent);
      result.push({
        ...this.triggerMessage,
        content: finalContent
      });
    }

    console.log('\n[Final API Messages]');
    console.log('Total messages:', result.length);
    result.forEach((msg, i) => {
      console.log(`Message ${i+1}: ${msg.role}, Content: ${msg.content.substring(0, 30)}...`);
    });

    return result;
  }
}
