import OpenAI from 'openai';
import config from '../config';
import { AIClientType } from '../types/AIClientType';
import { MessageInput, ToolsAI } from '../types/types';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
type openAIImageSize =
  | '1024x1024'
  | '256x256'
  | '512x512'
  | '1792x1024'
  | '1024x1792'
  | null
  | undefined;

export default class AIClient implements AIClientType {
  static apiKey?: string = config?.openAI?.apiKey || process.env.OPENAI_API_KEY;
  static imageSize: openAIImageSize = '1024x1024';
  static model = 'davinci';
  static summaryModel: string;
  prompt: string =
    config.ai.prompt ||
    process.env.AI_PROMPT ||
    'You are a nice assistant in a discord server';
  client: OpenAI;

  constructor() {
    if (config?.openAI?.imageSize || process.env.IMAGE_SIZE) {
      AIClient.imageSize = (config?.openAI?.imageSize ||
        process.env.IMAGE_SIZE) as openAIImageSize;
    }
    if (config?.openAI?.model || process.env.OPEN_AI_MODEL) {
      AIClient.model = (config.openAI.model ||
        process.env.OPEN_AI_MODEL) as string;
    }
    if (config?.openAI?.summaryModel || process.env.OPEN_AI_SUMMARY_MODEL) {
      AIClient.summaryModel = (config.openAI.summaryModel ||
        process.env.OPEN_AI_SUMMARY_MODEL) as string;
    }
    else {
      AIClient.summaryModel = AIClient.model;
    }

    if (!AIClient.apiKey) {
      throw new Error('No Open AI key configured');
    }
    else {
      this.client = new OpenAI({
        apiKey: AIClient.apiKey
      });
    }
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
      size: AIClient.imageSize
    });
    return response?.data[0]?.url || null;
  }

  async getSummary(messages: any[]): Promise<string | null> {
    const option: ChatCompletionCreateParamsNonStreaming = {
      messages: messages,
      model: AIClient.summaryModel
    };

    const response = await this.message(option);
    return response;
  }

  async getAiCompletion(
    conversation: MessageInput[],
    tools: ToolsAI[]
  ): Promise<string> {
    const options = {
      model: AIClient.model,
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
