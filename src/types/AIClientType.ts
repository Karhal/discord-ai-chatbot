import { MessageInput, AITool } from './types';

export type AIClientType = {
  getSummary: (systemPrompt: string, messages: MessageInput[]) => Promise<string | null>;
  getAiCompletion: (systemPrompt: string, conversation: MessageInput[], tools: AITool[]) => Promise<string>;
};
