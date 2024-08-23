import { AIClientType } from '../types/AIClientType';
import { MessageInput, AITool } from '../types/types';
import OpenAiClient from './ai-clients/openAI-client';
import ConfigManager from '../configManager';
import ClaudeClient from './ai-clients/claude-client';

export default class AIClient implements AIClientType {
  client: AIClientType | undefined;

  constructor() {
    if (ConfigManager.config.aiClient === 'openAI') {
      this.client = new OpenAiClient();
      console.log('OpenAI Client initialized');
    }
    else if (ConfigManager.config.aiClient === 'claude') {
      this.client = new ClaudeClient();
      console.log('Claude Client initialized');
    }
    else {
      console.log('AI Client not initialized');
    }
  }

  async getSummary(
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string | null> {
    if (!this.client) return null;
    return await this.client.getSummary(systemPrompt, messages);
  }

  async getAiCompletion(
    systemPrompt: string,
    conversation: MessageInput[],
    tools: AITool[]
  ): Promise<string> {
    if (!this.client) return '';
    return await this.client.getAiCompletion(systemPrompt, conversation, tools);
  }
}
