import { AIClientType } from '../../types/AIClientType';
import { MessageInput, AITool } from '../../types/types';
import ConfigManager from '../../configManager';
import { EventEmitter } from 'events';

export default class FlowiseClient extends EventEmitter implements AIClientType {
  private flowiseConfig = ConfigManager.config.flowise;

  constructor() {
    super();
    console.log('FlowiseClient initialized with config:', {
      apiUrl: this.flowiseConfig.apiUrl,
      flowId: this.flowiseConfig.flowId,
      agentName: this.flowiseConfig.agentName,
      active: this.flowiseConfig.active
    });
  }

  private async message(systemPrompt: string, messages: MessageInput[]): Promise<string | null> {
    try {
      // Ensure we have at least one message
      if (messages.length === 0) {
        throw new Error('No messages provided');
      }

      // Create history array with all messages, transforming assistant roles to apiMessage
      const history = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'apiMessage' : 'userMessage',
        content: msg.content
      }));

      console.log('Prepared history for Flowise:', history);

      const requestBody = {
        question: messages[messages.length - 1].content,
        overrideConfig: {
          agentName: this.flowiseConfig.agentName,
          vars: {
            user_prompt: systemPrompt
          }
        },
        history: history
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        `${this.flowiseConfig.apiUrl}/api/v1/prediction/${this.flowiseConfig.flowId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.flowiseConfig.apiKey}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data?.text || null;
    }
    catch (error) {
      console.error('Error with Flowise:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message
        });
      }
      throw error;
    }
  }

  async getAiCompletion(systemPrompt: string, messages: MessageInput[], tools: AITool[]): Promise<string> {
    console.log('FlowiseClient.getAiCompletion called with:', {
      systemPrompt,
      messages,
      tools
    });
    const response = await this.message(ConfigManager.config.AIPrompt, messages);
    console.log('Parsing response:', response);
    if (!response) {
      throw new Error('No response from Flowise');
    }
    return response;
  }
}
