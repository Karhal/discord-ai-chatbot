import Anthropic from '@anthropic-ai/sdk';
import { AIClientType } from '../../types/AIClientType';
import ConfigManager from '../../configManager';
import { MessageInput } from '../../types/types';
import transformOpenAIToolToClaudeTool from '../../handlers/tools-handler';
import { tools } from '../../tools';

export default class ClaudeClient implements AIClientType {
  client: Anthropic;
  claudeAIConfig = ConfigManager.config.claude;

  constructor() {
    this.client = new Anthropic({
      apiKey: this.claudeAIConfig.apiKey
    });
  }

  async getSummary(
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string | null> {
    const options = {
      model: this.claudeAIConfig.summaryModel,
      max_tokens: 2000,
      temperature: 0.5,
      system: systemPrompt,
      messages: messages
    };

    const response = await this.message(options);
    console.log(response);
    return response?.content[0]?.text || null;
  }

  async getAiCompletion(
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string> {
    const option = {
      model: this.claudeAIConfig.model,
      max_tokens: 2000,
      temperature: 0.5,
      system: systemPrompt,
      messages: messages,
      tools: tools
        .filter((tool) => tool.function.name === 'generate_image_with_dall_e')
        .map((tool) => {
          return transformOpenAIToolToClaudeTool(tool);
        })
    };
    const response = await this.message(option);
    return JSON.parse(response.content[0].text).content;
  }

  private async message(option: {
    model: string;
    max_tokens: number;
    temperature: number;
    system: string;
    messages: MessageInput;
  }): Promise<string | null> {
    if (!this.client) return null;
    console.log(option);
    const response = await this.client.messages.create(option);

    return response || null;
  }
}
