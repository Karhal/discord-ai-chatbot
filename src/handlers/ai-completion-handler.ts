import { readMemory } from '../tools-manager';
import { AIClientType } from '../types/AIClientType';
import { Collection, Message } from 'discord.js';
import { MessageInput } from '../types/types';
import { tools } from '../tools';
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
    const systemPrompt =
      'Craft a short summary of the given conversation that is detailed while maintaining clarity and conciseness. \
      Rely strictly on the provided text. Format the summary in one paragraph form for easy understanding. \
      The summary has to be the shortest possible (<100 words) and give a good idea of what the discussion is about. \
      Use the following language: ' +
      this.discordConfig.lang +
      '\n\nText:"""';

    const messages = [
      {
        role: 'user',
        content: this.getLastMessagesOfAChannel(15, channelId)
          .map((msg) => {
            return msg.content;
          })
          .join('\n')
      }
    ];
    const response = await this.aiClient.getSummary(systemPrompt, messages);
    console.log(response);
    return response;
  }

  async getAiCompletion(summary: string, channelId: string): Promise<string> {
    const memory: string = readMemory();
    const systemPrompt = `${this.prompt}.\n\n
    MEMORY:"""${memory}"""\n
    PREVIOUSLY:"""${summary}"""\n
    NOTE:"""
    - You have to respond to the user in the context of the conversation.
    - Format your response in a JSON object only with the keys 'content' and the key 'author'.
    """
    `;
    const messages: { role: string; content: string }[] = [
      {
        role: 'user',
        content: this.getLastMessagesOfAChannel(5, channelId)
          .map((msg) => {
            const contentParsed = JSON.parse(msg.content);
            return contentParsed.author + ': ' + contentParsed.content;
          })
          .join('\n')
      }
    ];

    const content = this.aiClient.getAiCompletion(
      systemPrompt,
      messages,
      tools
    );
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
