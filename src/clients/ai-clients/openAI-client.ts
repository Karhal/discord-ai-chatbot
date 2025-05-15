import OpenAI from 'openai';
import { AIClientType } from '../../types/AIClientType';
import { MessageInput } from '../../types/types';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
import ConfigManager from '../../configManager';
import { tools } from './../../tools-manager';
import { EventEmitter } from 'events';

export default class OpenAIClient extends EventEmitter implements AIClientType {
  client: OpenAI;
  openAIConfig = ConfigManager.config.openAI;
  requestTimeout = this.openAIConfig.requestTimeout || 300000;

  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: this.openAIConfig.apiKey,
      timeout: this.requestTimeout,
      maxRetries: 2
    });
  }

  private async message(options: ChatCompletionCreateParamsNonStreaming): Promise<string | null> {
    if (!this.client) return null;

    try {
      const response = await this.client.chat.completions.create(options);
      return response?.choices[0]?.message?.content || null;
    }
    catch (error) {
      console.error('Error with primary model:', error);

      if (error instanceof Error &&
          (error.message.includes('overloaded') ||
           error.message.includes('capacity') ||
           error.message.includes('rate limit'))) {

        const currentModel = options.model;
        let fallbackModel;

        if (currentModel === this.openAIConfig.model) {
          fallbackModel = this.openAIConfig.fallbackModel;
        }
        else {
          throw error;
        }

        console.log(`Retrying with fallback model: ${fallbackModel}`);

        try {
          const fallbackResponse = await this.client.chat.completions.create({
            ...options,
            model: fallbackModel
          });
          return fallbackResponse?.choices[0]?.message?.content || null;
        }
        catch (fallbackError) {
          console.error('Error with fallback model:', fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  async getAiCompletion(systemPrompt: string, messages: MessageInput[]): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    const channelId = lastMessage?.channelId || '';
    const formattedMessages = [
      { role: 'system', content: systemPrompt + `\n\nWhen using image generation tools, always include the channelId: "${channelId}" parameter.` }
    ];

    messages.forEach(msg => {
      formattedMessages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      });
    });

    try {
      const completion = await this.client.chat.completions.create({
        model: this.openAIConfig.model,
        messages: formattedMessages as any,
        tools: tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: {
              ...tool.function.parameters,
              properties: {
                ...tool.function.parameters.properties,
                channelId: {
                  type: 'string',
                  description: 'The channel ID where the image will be saved'
                }
              }
            }
          }
        }))
      });

      const responseMessage = completion.choices[0].message;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCalls = responseMessage.tool_calls;

        formattedMessages.push(responseMessage as any);

        const toolResponses = [];

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          if (!functionArgs.channelId) {
            functionArgs.channelId = channelId;
          }

          const tool = tools.find(t => t.name === functionName);
          let toolResponse = '';

          if (tool) {
            toolResponse = await tool.function.function(JSON.stringify(functionArgs));
          }
          else {
            toolResponse = JSON.stringify({ error: `Tool ${functionName} not found` });
          }

          toolResponses.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResponse
          });
        }

        formattedMessages.push(...toolResponses as any);

        const followUp = await this.client.chat.completions.create({
          model: this.openAIConfig.model,
          messages: formattedMessages as any
        });

        const content = followUp.choices[0].message.content || '';
        try {
          return JSON.parse(content).content || content;
        }
        catch (e) {
          return content;
        }
      }

      const content = responseMessage.content || '';
      try {
        return JSON.parse(content).content || content;
      }
      catch (e) {
        return content;
      }
    }
    catch (error) {
      console.error('Error in OpenAI completion:', error);

      // Handle specific error types with user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error instanceof TypeError && error.message.includes('network')) {
          return 'Sorry, I couldn\'t generate a response. Please try again later.';
        }

        if (error.message.includes('rate limit')) {
          return 'Sorry, I\'ve reached my rate limit. Please wait a moment before trying again.';
        }

        if (error.message.includes('overloaded') || error.message.includes('capacity')) {
          return 'The servers are currently overloaded. Please try again in a few minutes.';
        }
      }

      return 'Sorry, I couldn\'t generate a response. Please try again later.';
    }
  }
}
