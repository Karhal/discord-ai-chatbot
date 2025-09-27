import { AIClientType } from '../types/AIClientType';
import { MessageInput, AITool } from '../types/types';
import OpenAiClient from './ai-clients/openAI-client';
import ConfigManager from '../configManager';
import ClaudeClient from './ai-clients/claude-client';
import FlowiseClient from './ai-clients/flowise-client';
import { EventEmitter } from 'events';

export default class AIClient extends EventEmitter implements AIClientType {
  client: (AIClientType & EventEmitter) | undefined;

  constructor() {
    super();
    if (ConfigManager.config.aiClient === 'openAI') {
      this.client = new OpenAiClient();
      console.log('OpenAI Client initialized');
    }
    else if (ConfigManager.config.aiClient === 'claude') {
      this.client = new ClaudeClient();
      console.log('Claude Client initialized');
    }
    else if (ConfigManager.config.aiClient === 'flowise') {
      this.client = new FlowiseClient();
      console.log('Flowise Client initialized');
    }
    else {
      console.log('AI Client not initialized');
    }
    if (this.client) {
      this.client.on('working', (data: unknown) => {
        this.emit('completionRequested', data);
      });
    }
  }

  async getAiCompletion(systemPrompt: string, conversation: MessageInput[], tools: AITool[]): Promise<string> {
    if (!this.client) return '';
    this.emit('completionRequested', { systemPrompt, conversation });
    const rawResponse = await this.client.getAiCompletion(systemPrompt, conversation, tools);
    return this.extractResponseTagContent(rawResponse);
  }

  private extractResponseTagContent(text: string): string {
    if (!text) return '';
    console.log('Message from AI', text);
    const match = text.match(/<response>([\s\S]*?)<\/response>/i);
    return match ? match[1].trim() : text;
  }
}
