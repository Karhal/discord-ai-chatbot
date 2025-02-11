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

    try {
      const response = await this.client.chat.completions.create(options);
      return response?.choices[0]?.message?.content || null;
    }
    catch (error) {
      console.error('Error with primary model:', error);

      if (error instanceof Error && 
          (error.message.includes('overloaded') || 
           error.message.includes('capacity') ||
           error.message.includes('rate limit'))) {

        const currentModel = options.model;
        let fallbackModel;

        if (currentModel === this.openAIConfig.model) {
          fallbackModel = this.openAIConfig.fallbackModel;
        }
        else {
          throw error;
        }

        console.log(`Retrying with fallback model: ${fallbackModel}`);

        try {
          const fallbackResponse = await this.client.chat.completions.create({
            ...options,
            model: fallbackModel
          });
          return fallbackResponse?.choices[0]?.message?.content || null;
        }
        catch (fallbackError) {
          console.error('Error with fallback model:', fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  async getAiCompletion(systemPrompt: string, messages: MessageInput[]): Promise<string> {
    systemPrompt = `${systemPrompt}.\n\n"""NOTE: Your response will be a raw json: {"content": "your response", "author": "you"} """`;
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
