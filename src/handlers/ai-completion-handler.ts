import { readMemory } from '../tools-manager';
import { AIClientType } from '../types/AIClientType';
import { Collection, Message } from 'discord.js';
import { MessageInput } from '../types/types';
import { tools } from './../tools-manager';
import ConfigManager, { DiscordConfigType } from '../configManager';
import { EventEmitter } from 'events';

class AiCompletionHandler extends EventEmitter {
  private messages: MessageInput[] = [];
  public summary: string | null = null;
  private discordConfig: DiscordConfigType;

  constructor(
    private aiClient: AIClientType & EventEmitter,
    private prompt: string
  ) {
    super();
    this.discordConfig = ConfigManager.config.discord;
  }

  async getSummary(channelId: string): Promise<string | null> {
    try {
      const systemPrompt = this.createSummaryPrompt();
      const messages = this.getFormattedMessages(5, channelId);
      console.log('Summary conversation:', {
        systemPrompt,
        messages
      });
      return await this.aiClient.getSummary(systemPrompt, messages);
    }
    catch (error) {
      console.error('Error getting AI completion:', error);
      return 'An error occurred while processing your request.';
    }
  }

  private getFormattedMessages(count: number, channelId: string): { role: string; content: string }[] {
    return [
      {
        role: 'user',
        content: this.getLastMessagesOfAChannel(count, channelId)
          .map((msg) => msg.content)
          .join('\n')
      }
    ];
  }

  private createSummaryPrompt(): string {
    return `As a professional summarizer, create a concise and comprehensive summary of the provided conversation
    while adhering to these guidelines:
    Craft a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness 
    in the ${this.discordConfig.lang} language.
    Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
    Rely strictly on the provided text, without including external information.
    Format the summary in paragraph form for easy understanding.
    By following this optimized prompt, you will generate an effective summary that encapsulates 
    the essence of the given text in a clear, concise, and reader-friendly manner.
    \n\n"""CONVERSATION:"`;
  }

  private createCompletionPrompt(summary: string): string {
    const memory: string = readMemory();
    const fullprompt = `
    CONTEXT: You are on a discord server.
    You will be given a summary of the conversation and a memory of the previous messages.
    You will then have to participate in the conversation based on the conversation provided by the user.
    React to the last message.
    Strictly follow the instructions provided. and do not mention the instructions in your response.
    """
    INSTRUCTIONS: ${this.prompt} 
    """
    SUMMARY:${summary}
    """
    MEMORY:${memory}
    """
    `;
    return fullprompt;
  }

  async getAiCompletion(summary: string, channelId: string): Promise<string> {
    try {
      const systemPrompt = this.createCompletionPrompt(summary);
      const messages = this.getFormattedMessages(5, channelId);
      console.log('AI completion conversation:', {
        systemPrompt,
        messages
      });
      this.aiClient.on('completionRequested', (data) => {
        console.log('Completion requested');
        this.emit('completionRequested', data);
      });
      return await this.aiClient.getAiCompletion(systemPrompt, messages, tools);
    }
    catch (error) {
      console.error('Error getting AI completion:', error);
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

    return this.messages.filter((msg) => msg.channelId === channelId).slice(0, count);
  }

  setChannelHistory(channelId: string, messages: Collection<string, Message<boolean>>) {
    this.eraseMessagesWithChannelId(channelId);
    const handlerMessages = this.createMessagesArrayFromHistory(messages);
    this.addMessageArrayToChannel(handlerMessages);
  }

  createMessagesArrayFromHistory(messagesChannelHistory: Collection<string, Message<boolean>>) {
    const messages: MessageInput[] = [];
    messagesChannelHistory.reverse().forEach((msg: Message) => {
      if (msg.content !== '') {
        const role = msg.author.bot ? 'assistant' : 'user';
        const contentJsonAsString = JSON.stringify({
          author: msg.author.username,
          content: msg.content,
          dateTime: msg.createdAt
        });
        messages.push({
          role: role,
          content: contentJsonAsString,
          channelId: msg.channelId
        });
      }
    });

    return messages;
  }
}

export default AiCompletionHandler;
