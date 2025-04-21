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
    const cleanedMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));

    const options: Anthropic.MessageCreateParams = {
      model: this.claudeAIConfig.model,
      max_tokens: this.claudeAIConfig.maxTokens,
      temperature: this.claudeAIConfig.temperature,
      system: systemPrompt,
      messages: cleanedMessages,
      stream: false,
      tools: tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema
        };
      })
    };

    const response = await this.message(options);
    if (!response) {
      throw new Error('No response from Claude');
    }
    return await this.handleResponse(response, systemPrompt, messages);
  }

  private async message(options: Anthropic.MessageCreateParams): Promise<Anthropic.Message> {
    if (!this.client) {
      throw new Error('Claude client not initialized');
    }
    this.emit('working', options);
    const intervalId = setInterval(() => {
      this.emit('working', options);
    }, 4000);

    try {
      const response = await this.client.messages.create(options);
      if (!response) {
        throw new Error('Empty response from Claude');
      }
      return response as Anthropic.Message;
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
          if (!fallbackResponse) {
            throw new Error('Empty response from Claude fallback model');
          }
          return fallbackResponse as Anthropic.Message;
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
      const textContent = response.content.find(item => item.type === 'text');
      return textContent?.text || '';
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

    const lastMessage = messages[messages.length - 1];
    const channelId = lastMessage?.channelId || '';
    const toolArgsWithChannelId = {
      ...toolArgs as Record<string, unknown>,
      channelId
    };

    const toolResult = await this.executeToolFunction(toolToUse, toolArgsWithChannelId);
    this.updateMessages(messages, toolUseItem, toolResult);

    return this.getSecondCallResponse(systemPrompt, messages);
  }

  private findTool(toolName: string): AITool | undefined {
    return tools.find((tool) => tool.name === toolName);
  }

  private async executeToolFunction(tool: AITool, args: Record<string, unknown>): Promise<object> {
    const result = await tool.function.function(JSON.stringify(args));
    return result as object;
  }

  private updateMessages(messages: MessageInput[], toolUseItem: Anthropic.ToolUseBlock, toolResult: object): void {
    const lastMessage = messages[messages.length - 1];
    const channelId = lastMessage?.channelId || '';

    messages.push(
      {
        role: 'assistant',
        content: JSON.stringify([{ type: 'tool_use', id: toolUseItem.id, name: toolUseItem.name, input: toolUseItem.input }]),
        channelId
      },
      {
        role: 'user',
        content: JSON.stringify([
          {
            type: 'tool_result',
            tool_use_id: toolUseItem.id,
            content: [{ type: 'text', text: JSON.stringify(toolResult) }]
          }
        ]),
        channelId
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
    const textContent = response.content.find(item => item.type === 'text');
    return textContent?.text || '';
  }
}
