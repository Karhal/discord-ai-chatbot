import { readMemory } from '../tools-manager';
import { AIClientType } from '../types/AIClientType';
import { Collection, Message } from 'discord.js';
import { MessageInput } from '../types/types';
import { tools } from './../tools-manager';
import ConfigManager, { DiscordConfigType } from '../configManager';

class AiCompletionHandler {
  private messages: MessageInput[] = [];
  public summary: string | null = null;
  private discordConfig: DiscordConfigType;

  constructor(
    private aiClient: AIClientType,
    private prompt: string
  ) {
    this.discordConfig = ConfigManager.config.discord;
  }

  async getSummary(channelId: string): Promise<string | null> {
    try {
      const systemPrompt = this.createSummaryPrompt();
      const messages = this.getFormattedMessages(5, channelId);
      console.log('Fetch summary args:', systemPrompt, messages);
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
    return `Craft a short summary of the given conversation that is detailed while maintaining clarity and conciseness. 
      Rely strictly on the provided text. Format the summary in one paragraph form for easy understanding. 
      The summary has to be the shortest possible (<100 words) and give a good idea of what the discussion is about. 
      Use the following language: ${this.discordConfig.lang}\n\n"""Text:`;
  }

  private createCompletionPrompt(summary: string): string {
    const memory: string = readMemory();
    return `${this.prompt}.\n\n
    """MEMORY:${memory}"""\n
    """PREVIOUSLY:${summary}"""\n
    """NOTE:
    - You have to respond to the user in the context of the conversation.
    - Respond only to the last user message, in a strictly valid raw JSON string.
    - Example of response:{"content": "your response", "author": "your name" }
    """`;
  }

  async getAiCompletion(summary: string, channelId: string): Promise<string> {
    try {
      const systemPrompt = this.createCompletionPrompt(summary);
      const messages = this.getFormattedMessages(5, channelId);
      console.log('Fetch completion args:', systemPrompt, messages);

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
