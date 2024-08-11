import OpenAI from 'openai';
import { AIClientType } from '../types/AIClientType';
import { MessageInput, ToolsAI } from '../types/types';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
import ConfigManager from '../configManager';

type openAIImageSize =
  | '1024x1024'
  | '256x256'
  | '512x512'
  | '1792x1024'
  | '1024x1792'
  | null
  | undefined;

export default class AIClient implements AIClientType {
  private imageSize: openAIImageSize;

  client: OpenAI;
  openAIConfig = ConfigManager.config.openAI;

  constructor() {
    this.imageSize = this.openAIConfig.imageSize as openAIImageSize;
    this.client = new OpenAI({
      apiKey: this.openAIConfig.apiKey
    });
  }

  async message(
    option: ChatCompletionCreateParamsNonStreaming
  ): Promise<string | null> {
    if (!this.client) return null;

    const response = await this.client.chat.completions.create(option);
    return response?.choices[0]?.message?.content || null;
  }

  async generateImage(prompt: string): Promise<string | null> {
    if (!this.client) return null;

    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: this.imageSize
    });
    return response?.data[0]?.url || null;
  }

  async getSummary(messages: any[]): Promise<string | null> {
    const option: ChatCompletionCreateParamsNonStreaming = {
      messages: messages,
      model: this.openAIConfig.summaryModel
    };

    const response = await this.message(option);
    return response;
  }

  async getAiCompletion(
    conversation: MessageInput[],
    tools: ToolsAI[]
  ): Promise<string> {
    const options = {
      model: this.openAIConfig.model,
      messages: conversation,
      tools: tools,
      response_format: { type: 'json_object' }
    };

    const runner = this.client.beta.chat.completions.runTools(options);
    const response = await runner.finalContent();
    console.log('response', response);
    return JSON.parse(response as string).content;
  }
}
