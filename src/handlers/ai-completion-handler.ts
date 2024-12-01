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
      const messages = this.getFormattedFirstMessages(this.discordConfig.maxHistory, channelId);
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

  private getFormattedFirstMessages(count: number, channelId: string): { role: string; content: string }[] {
    return [
      {
        role: 'user',
        content: this.getFirstMessagesOfAChannel(count, channelId)
          .map((msg) => msg.content)
          .join('\n')
      }
    ];
  }

  private getFormattedLastMessages(count: number, channelId: string): { role: string; content: string }[] {
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
    You are an AI assistant engaged in a conversation on Discord. 
    Your goal is to provide helpful, engaging, and contextually appropriate responses to users. 
    Here's a summary of the discussion so far:
    <conversation_summary>
${summary}
</conversation_summary>
Here are the system instructions given by the user. It's defined by the user, 
you have to strictly follow these instructions : 
<system_instructions>
${this.prompt}
</system_instructions>

When responding to the user, follow these guidelines:

Formulate a response that directly addresses the user's input and contributes to the ongoing discussion.
Ensure your response is appropriate for Discord and maintains a conversational tone.
Avoid simply repeating the last message; instead, engage with the content and move the conversation forward.

Consider the following:
- What are the main topics or themes in the conversation history?
- What is the main topic or question in the user's most recent message?
- How does it relate to the previous conversation?
- Does the user address his message to you ?
- What information or perspective can you add to enhance the discussion?
- How can you make your response engaging and encourage further conversation?
- What potential follow-up questions or discussion points could you include?
- Write only your response.

After your analysis, provide your response as you would directly say it to the user on Discord. 
Make sure it's conversational, relevant, and shows that you're actively participating in the discussion.

Example output structure:

[Your direct response to the user, written in a conversational style appropriate for Discord]

Remember, your goal is to be a helpful and engaging conversation partner, not just an information dispenser. 
Show interest in the topic, ask follow-up questions when appropriate, and maintain a friendly, approachable tone.
    `;
    return fullprompt;
  }

  async getAiCompletion(summary: string, channelId: string): Promise<string> {
    try {
      const systemPrompt = this.createCompletionPrompt(summary);
      const messages = this.getFormattedLastMessages(5, channelId);
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
