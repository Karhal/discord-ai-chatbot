import { Mistral } from '@mistralai/mistralai';
import { AIClientType } from '../../types/AIClientType';
import ConfigManager from '../../configManager';
import { MessageInput } from '../../types/types';
import { tools } from '../../tools-manager';

export default class MistralClient implements AIClientType {
  client: Mistral;
  mistralAIConfig = ConfigManager.config.mistral;

  constructor() {
    this.client = new Mistral({
      apiKey: this.mistralAIConfig.apiKey
    });
  }

  async getSummary(
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string | null> {
    messages.unshift({ role: 'system', content: systemPrompt });
    const options = {
      model: this.mistralAIConfig.summaryModel,
      max_tokens: 2000,
      temperature: 0.7,
      messages: messages
    };
    console.log(messages);
    const response = await this.message(options);
    console.log(response?.choices[0].message.content);
    return response?.choices[0].message.content || null;
  }

  async getAiCompletion(
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string> {
    messages.unshift({ role: 'system', content: systemPrompt });
    const options = {
      model: this.mistralAIConfig.model,
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages,
      tools: tools
    };
    const response = await this.message(options);
    return await this.handleResponse(response, systemPrompt, messages);
  }

  private async message(options: {
    model: string;
    max_tokens: number;
    temperature: number;
    system: string;
    messages: MessageInput;
    response_format: {type: 'json_object'}
  }): Promise<string | null> {
    if (!this.client) return null;
    const response = await this.client.chat.complete(options);

    return response || null;
  }

  private async handleResponse(
    response: any,
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string> {
    let content = response.choices[0].message.content || [];
    console.log('Content:', content);

    const toolUseItem = this.findToolUseItem(response.choices[0].message);
    if (!toolUseItem) {
      if (content.startsWith('```json') && content.endsWith('```')) {
        content = content.slice(7, -3).trim();
      }
      return this.handleSimpleTextResponse(content);
    }

    return this.handleToolUseResponse(toolUseItem, systemPrompt, messages);
  }

  private findToolUseItem(content: any[]): any {
    if (content.tool_calls && content.tool_calls.length > 0) {
      return content.tool_calls[0];
    }
  }

  private handleSimpleTextResponse(content: string): string {
    console.log('Simple text response', content);
    return JSON.parse(content)?.content || '';
  }

  private async handleToolUseResponse(
    toolUseItem: any,
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

  private findTool(toolName: string): any {
    return tools.find((tool) => tool.name === toolName);
  }

  private async executeToolFunction(tool: any, args: any): Promise<any> {
    return await tool.function.function(JSON.stringify(args));
  }

  private updateMessages(messages: MessageInput[], toolUseItem: any, toolResult: any): void {
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
