import Anthropic from '@anthropic-ai/sdk';
import { AIClientType } from '../../types/AIClientType';
import ConfigManager from '../../configManager';
import { AITool, MessageInput } from '../../types/types';
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

    const response: Anthropic.Message = await this.message(options);
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
    const response: Anthropic.Message = await this.message(options);
    return await this.handleResponse(response, systemPrompt, messages);
  }

  private async message(options: Anthropic.MessageCreateParams ): Promise<string | null> {
    if (!this.client) return null;
    const response = await this.client.messages.create(options);

    return response || null;
  }

  private async handleResponse(
    response: Anthropic.Message,
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string> {
    console.log('Response:', response);

    const toolUseItem = this.findToolUseItem(response);
    if (!toolUseItem) {
      return this.handleSimpleTextResponse(response);
    }

    return this.handleToolUseResponse(toolUseItem, systemPrompt, messages);
  }

  private findToolUseItem(message: Anthropic.Message): any {
    const content = message.content;
    return content.find((item: { type: string }) => item.type === 'tool_use');
  }

  private handleSimpleTextResponse(message: Anthropic.Message): string {
    const content = message.content[0].text;
    console.log('Simple text response', content);
    return JSON.parse(content)?.content || '';
  }

  private async handleToolUseResponse(
    toolUseItem: Anthropic.ToolUseBlock,
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string> {
    const { name: toolName, id: toolUseId, input: toolArgs } = toolUseItem;
    const toolToUse = this.findTool(toolName);

    if (!toolToUse) {
      console.log(`Tool not found: ${toolName}`);
      return '';
    }

    const toolResult = await this.executeToolFunction(toolToUse, toolArgs);
    this.updateMessages(messages, toolUseItem, toolResult);

    return this.getSecondCallResponse(systemPrompt, messages);
  }

  private findTool(toolName: string): AITool {
    return tools.find((tool) => tool.name === toolName);
  }

  private async executeToolFunction(tool: AITool, args: object): Promise<any> {
    return await tool.function.function(JSON.stringify(args));
  }

  private updateMessages(messages: MessageInput[], toolUseItem: Anthropic.ToolUseBlock, toolResult: object): void {
    messages.push(
      { role: 'assistant', content: [{ type: 'tool_use', id: toolUseItem.id, name: toolUseItem.name, input: toolUseItem.input }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUseItem.id, content: [{ type: 'text', text: JSON.stringify(toolResult) }] }] }
    );
  }

  private async getSecondCallResponse(systemPrompt: string, messages: MessageInput[]): Promise<string> {
    console.log('Second call message:', messages[messages.length - 1]);
    const result = await this.getAiCompletion(systemPrompt, messages);
    console.log('Second call response:', result);
    return result;
  }
}
