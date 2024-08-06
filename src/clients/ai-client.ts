import OpenAI from 'openai';
import config from '../config';
import { AIClientType } from '../types/AIClientType';
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
  static openAiKey?: string =
    config?.openAI?.apiKey || process.env.OPENAI_API_KEY;
  static imageSize: openAIImageSize = '1024x1024';
  client: OpenAI;

  constructor() {
    if (config?.openAI?.imageSize || process.env.IMAGE_SIZE) {
      AIClient.imageSize = (config?.openAI?.imageSize ||
        process.env.IMAGE_SIZE) as openAIImageSize;
    }
    if (!AIClient.openAiKey) {
      throw new Error('No Open AI key configured');
    }
    else {
      this.client = new OpenAI({
        apiKey: AIClient.openAiKey
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
}
