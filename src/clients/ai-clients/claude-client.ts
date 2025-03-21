import Anthropic from '@anthropic-ai/sdk';
import { AIClientType } from '../../types/AIClientType';
import ConfigManager from '../../configManager';
import { AITool, MessageInput } from '../../types/types';
import { tools } from './../../tools-manager';
import { EventEmitter } from 'events';

export default class ClaudeClient extends EventEmitter implements AIClientType {
  client: Anthropic;
  claudeAIConfig = ConfigManager.config.claude;

  constructor() {
    super();
    this.client = new Anthropic({
      apiKey: this.claudeAIConfig.apiKey
    });
  }

  async getAiCompletion(systemPrompt: string, messages: MessageInput[]): Promise<string> {
    const options: Anthropic.MessageCreateParams = {
      model: this.claudeAIConfig.model,
      max_tokens: this.claudeAIConfig.maxTokens,
      temperature: this.claudeAIConfig.temperature,
      system: systemPrompt,
      messages: messages,
      stream: false,
      tools: tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema
        };
      })
    };

    const response: Anthropic.Message = await this.message(options);
    return await this.handleResponse(response, systemPrompt, messages);
  }

  private async message(options: Anthropic.MessageCreateParams): Promise<Anthropic.Message | null> {
    if (!this.client) return null;
    this.emit('working', options);
    const intervalId = setInterval(() => {
      this.emit('working', options);
    }, 4000);

    try {

      const response = await this.client.messages.create(options);
      return response || null;
    }
    catch (error) {
      console.error('Error with primary model:', error);

      if (error instanceof Error &&
          (error.message.includes('overloaded') ||
           error.message.includes('capacity') ||
           error.message.includes('rate limit'))) {

        const currentModel = options.model;
        let fallbackModel;

        if (currentModel === this.claudeAIConfig.model) {
          fallbackModel = this.claudeAIConfig.fallbackModel;
        }
        else {
          throw error;
        }

        console.log(`Retrying with fallback model: ${fallbackModel}`);

        try {
          const fallbackResponse = await this.client.messages.create({
            ...options,
            model: fallbackModel
          });
          return fallbackResponse || null;
        }
        catch (fallbackError) {
          console.error('Error with fallback model:', fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
    finally {
      clearInterval(intervalId);
    }
  }

  private async handleResponse(
    response: Anthropic.Message,
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string> {
    const toolUseItem = this.findToolUseItem(response);
    if (!toolUseItem) {
      return response.content[0].text;
    }

    return this.handleToolUseResponse(toolUseItem, systemPrompt, messages);
  }

  private findToolUseItem(message: Anthropic.Message): Anthropic.ToolUseBlock | undefined {
    return message.content.find((item): item is Anthropic.ToolUseBlock => item.type === 'tool_use');
  }

  private async handleToolUseResponse(
    toolUseItem: Anthropic.ToolUseBlock,
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string> {
    const { name: toolName, id: toolUseId, input: toolArgs } = toolUseItem;
    const toolToUse = this.findTool(toolName);

    if (!toolToUse) {
      return '';
    }

    const toolResult = await this.executeToolFunction(toolToUse, toolArgs);
    this.updateMessages(messages, toolUseItem, toolResult);

    return this.getSecondCallResponse(systemPrompt, messages);
  }

  private findTool(toolName: string): AITool | undefined {
    return tools.find((tool) => tool.name === toolName);
  }

  private async executeToolFunction(tool: AITool, args: object): Promise<object> {
    const result = await tool.function.function(JSON.stringify(args));
    return result as object;
  }

  private updateMessages(messages: MessageInput[], toolUseItem: Anthropic.ToolUseBlock, toolResult: object): void {
    messages.push(
      {
        role: 'assistant',
        content: [{ type: 'tool_use', id: toolUseItem.id, name: toolUseItem.name, input: toolUseItem.input }]
      },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseItem.id,
            content: [{ type: 'text', text: JSON.stringify(toolResult) }]
          }
        ]
      }
    );
  }

  private async getSecondCallResponse(systemPrompt: string, messages: MessageInput[]): Promise<string> {
    const result = await this.getAiCompletion(systemPrompt, messages);
    return result;
  }

  async analyzeImage(imageBase64: string, prompt: string, mediaType: string): Promise<string> {
    const options: Anthropic.MessageCreateParams = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    };

    const response = await this.message(options);
    return response?.content[0]?.text || '';
  }
}
