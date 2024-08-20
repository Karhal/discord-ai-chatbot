import Anthropic from '@anthropic-ai/sdk';
import { AIClientType } from '../../types/AIClientType';
import ConfigManager from '../../configManager';
import { MessageInput } from '../../types/types';
import { tools } from './../../tools-manager';

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
    return response?.content[0]?.text || null;
  }

  async getAiCompletion(
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string> {
    const options = {
      model: this.claudeAIConfig.model,
      max_tokens: 2000,
      temperature: 0.5,
      system: systemPrompt,
      messages: messages,
      tools: tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema
        };
      })
    };
    const response = await this.message(options);
    return await this.handleResponse(response);
  }

  private async message(options: {
    model: string;
    max_tokens: number;
    temperature: number;
    system: string;
    messages: MessageInput;
  }): Promise<string | null> {
    if (!this.client) return null;
    const response = await this.client.messages.create(options);

    return response || null;
  }

  handleResponse = async (response: any) => {
    const content = response?.content || [];
    console.log('Content:', content);
    const toolUseItem = content.find(
      ({ type }: { type: string }) => type === 'tool_use'
    );
    const textItem = content.find(
      ({ type }: { type: string }) => type === 'text'
    );

    const textResponse = textItem?.text || '';
    console.log('Is toolUseItem:', toolUseItem);
    if (toolUseItem) {
      const toolName = toolUseItem.name;
      const toolToUse = tools.find((tool) => tool.name === toolName);

      if (toolToUse) {
        await toolToUse.function.function(JSON.stringify(toolUseItem.input));
      }

      return textResponse;
    }
    else {
      console.log('simple text response', JSON.parse(content[0]?.text).content);
      return JSON.parse(content[0]?.text).content || '';
    }
  };
}
