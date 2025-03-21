import { AIClientType } from '../../types/AIClientType';
import { MessageInput, AITool } from '../../types/types';
import ConfigManager from '../../configManager';
import { EventEmitter } from 'events';
import axios from 'axios';

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

      // Create history array with all messages except the last one
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'apiMessage' : msg.role,
        content: msg.content
      }));

      // Add the last message to history as well
      history.push({
        role: messages[messages.length - 1].role,
        content: messages[messages.length - 1].content
      });

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

      const response = await axios.post(
        `${this.flowiseConfig.apiUrl}/api/v1/prediction/${this.flowiseConfig.flowId}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.flowiseConfig.apiKey}`
          }
        }
      );

      console.log('Received response from Flowise:', {
        status: response.status,
        data: response.data
      });

      return response.data?.text || null;
    }
    catch (error) {
      console.error('Error with Flowise:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
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
    const response = await this.message(systemPrompt, messages);
    console.log('Parsing response:', response);
    if (!response) {
      throw new Error('No response from Flowise');
    }
    return response;
  }
}
