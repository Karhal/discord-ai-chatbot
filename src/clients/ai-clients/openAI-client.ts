import OpenAI from 'openai';
import { AIClientType } from '../../types/AIClientType';
import { MessageInput } from '../../types/types';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
import ConfigManager from '../../configManager';
import { tools } from './../../tools-manager';
import { EventEmitter } from 'events';

export default class OpenAIClient extends EventEmitter implements AIClientType {
  client: OpenAI;
  openAIConfig = ConfigManager.config.openAI;

  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: this.openAIConfig.apiKey
    });
  }

  private async message(options: ChatCompletionCreateParamsNonStreaming): Promise<string | null> {
    if (!this.client) return null;

    const response = await this.client.chat.completions.create(options);
    return response?.choices[0]?.message?.content || null;
  }

  async getSummary(systemPrompt: string, messages: MessageInput[]): Promise<string | null> {
    const options = {
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      model: this.openAIConfig.summaryModel
    };

    const response = await this.message(options);
    return response;
  }

  async getAiCompletion(systemPrompt: string, messages: MessageInput[]): Promise<string> {
    const options = {
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      model: this.openAIConfig.model,
      tools: tools,
      response_format: { type: 'json_object' }
    };
    const runner = this.client.beta.chat.completions.runTools(options);
    const response = await runner.finalContent();
    return JSON.parse(response as string).content;
  }
}
