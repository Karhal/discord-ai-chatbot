import { Mistral } from '@mistralai/mistralai';
import config from '../config';
import { AIClientType } from '../types/AIClientType';
import { MessageInput, ToolsAI } from '../types/types';
import { ChatCompletionRequest } from '@mistralai/mistralai/models/components';

export default class MistralAIClient implements AIClientType {
  static apiKey?: string =
    config?.mistralAI?.apiKey || process.env.MISTRALAI_API_KEY;
  static model = 'davinci';
  static summaryModel: string;
  prompt: string =
    config.ai.prompt ||
    process.env.AI_PROMPT ||
    'You are a nice assistant in a discord server';
  client: Mistral;

  constructor() {
    if (config?.openAI?.model || process.env.OPEN_AI_MODEL) {
      MistralAIClient.model = (config.mistralAI.model ||
        process.env.MISTRALAI_MODEL) as string;
    }
    if (config?.openAI?.summaryModel || process.env.MISTRALAI_SUMMARY_MODEL) {
      MistralAIClient.summaryModel = (config.mistralAI.summaryModel ||
        process.env.MISTRALAI_SUMMARY_MODEL) as string;
    }
    else {
      MistralAIClient.summaryModel = MistralAIClient.model;
    }

    if (!MistralAIClient.apiKey) {
      throw new Error('No Mistral AI key configured');
    }
    else {
      this.client = new Mistral({
        apiKey: MistralAIClient.apiKey
      });
    }
  }

  async message(option: ChatCompletionRequest): Promise<string | null> {
    if (!this.client) return null;

    const response = await this.client.chat.complete(option);
    if (!response?.choices || !response?.choices[0]?.message?.content) {
      return null;
    }
    return response?.choices[0]?.message?.content;
  }

  async getSummary(messages: any[]): Promise<string | null> {
    const option: ChatCompletionRequest = {
      messages: messages,
      model: MistralAIClient.summaryModel
    };

    const response = await this.message(option);
    return response;
  }

  async getAiCompletion(
    conversation: MessageInput[],
    tools: ToolsAI[]
  ): Promise<string> {
    const options: any = {
      model: MistralAIClient.model,
      messages: conversation,
      tools: tools,
      response_format: { type: 'json_object' }
    };

    const response = await this.message(options);
    return JSON.parse(response as string).content;
  }
}
