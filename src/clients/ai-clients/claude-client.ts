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

  async getSummary(systemPrompt: string, messages: MessageInput[]): Promise<string | null> {
    const options: Anthropic.MessageCreateParams = {
      model: this.claudeAIConfig.summaryModel,
      max_tokens: this.claudeAIConfig.maxTokens,
      temperature: this.claudeAIConfig.temperature,
      system: systemPrompt,
      messages: messages,
      stream: false
    };

    const response = await this.message(options);
    return response?.content[0]?.text || null;
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
      console.log('no tool use item');
      console.log(response);
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
}
