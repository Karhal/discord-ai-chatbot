import { readMemory } from '../tools';
import { AIClientType } from '../types/AIClientType';
import { Collection, Message } from 'discord.js';
import { ToolsAI, MessageInput } from '../types/types';
import ConfigManager, { DiscordConfigType } from '../configManager';

class AiCompletionHandler {
  private messages: MessageInput[] = [];
  public summary: string | null = null;
  private discordConfig: DiscordConfigType;

  constructor(
    private aiClient: AIClientType,
    private prompt: string,
    private tools: ToolsAI[]
  ) {
    this.discordConfig = ConfigManager.config.discord;
  }

  async getSummary(channelId: string): Promise<string | null> {
    const messages = [
      {
        role: 'assistant',
        content:
          'Craft a short summary of the given conversation that is detailed while maintaining clarity and conciseness. Rely strictly on the provided text. Format the summary in one paragraph form for easy understanding. The summary has to be the shortest possible (<100 words) and give a good idea of what the discussion is about. Use the following language: ' +
          this.discordConfig.lang +
          '\n\nText:"""'
      },
      {
        role: 'user',
        content: this.getFirstMessagesOfAChannel(5, channelId)
          .map((msg) => {
            const contentParsed = JSON.parse(msg.content);
            return contentParsed.author + ': ' + msg.content;
          })
          .join('\n\n')
      }
    ];

    const response = await this.aiClient.getSummary(messages);
    return response;
  }

  async getAiCompletion(summary: string, channelId: string): Promise<string> {
    const memory: string = readMemory();
    const fullPrompt = `${this.prompt}.\n\n
    MEMORY:"""\n${memory}\n"""\n
    PREVIOUSLY:"""\n${summary}\n"""
    NOTE:"""\n
    - Format your response in a JSON object only with the keys 'content' and the key 'author'.
    - If you have an image to add, use the key 'content' to store the image URL.
    - When you use a tool, use the property 'content' to store its results.
    - Interract only to the last message mentionning you. The rest is to give you context.
    - Consider the DateTime given with the last message to avoid being out of context.
    - You are concerned only when people use your name\n"""
    `;
    let conversation = [{ role: 'assistant', content: fullPrompt }];
    conversation = conversation.concat(
      this.getLastMessagesOfAChannel(5, channelId) || []
    );

    const content = this.aiClient.getAiCompletion(conversation, this.tools);
    return content;
  }

  addMessageToChannel(
    message: MessageInput,
    limit = this.discordConfig.maxHistory
  ) {
    if (this.messages) {
      const channelMessages = this.messages.filter(
        (msg) => msg.channelId === message.channelId
      );

      channelMessages.push(message);
      if (limit) {
        const numLimit = parseInt(limit.toString());
        if (channelMessages.length > numLimit) {
          channelMessages.shift();
        }
      }
      this.messages = this.messages.filter(
        (msg) => msg.channelId !== message.channelId
      );
      this.messages = [...channelMessages, ...this.messages];
    }
  }

  addMessageArrayToChannel(
    messages: Array<MessageInput>,
    limit = this.discordConfig.maxHistory
  ) {
    messages.forEach((message) => {
      this.addMessageToChannel(message, limit);
    });
  }

  eraseMessagesWithChannelId(channelId: string) {
    if (this.messages) {
      this.messages = this.messages.filter(
        (msg) => msg.channelId !== channelId
      );
    }
  }

  getLastMessagesOfAChannel(count: number, channelId: string) {
    if (!this.messages) return [];

    return this.messages
      .filter((msg) => msg.channelId === channelId)
      .slice(-count);
  }

  getFirstMessagesOfAChannel(count: number, channelId: string) {
    if (!this.messages) return [];

    return this.messages
      .filter((msg) => msg.channelId === channelId)
      .slice(0, count);
  }

  setChannelHistory(
    channelId: string,
    messages: Collection<string, Message<boolean>>
  ) {
    this.eraseMessagesWithChannelId(channelId);
    const handlerMessages = this.createMessagesArrayFromHistory(messages);
    this.addMessageArrayToChannel(handlerMessages);
  }

  createMessagesArrayFromHistory(
    messagesChannelHistory: Collection<string, Message<boolean>>
  ) {
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
