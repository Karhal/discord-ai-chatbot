import { MessageInput, AITool } from './types';

export type AIClientType = {
  getAiCompletion: (systemPrompt: string, conversation: MessageInput[], tools: AITool[]) => Promise<string>;
};
