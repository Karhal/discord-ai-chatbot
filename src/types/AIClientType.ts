import { MessageInput, ToolsAI } from './types';

export type AIClientType = {
  generateImage: (prompt: string) => Promise<string | null>;
  getSummary: (
    systemPrompt: string,
    messages: MessageInput[]
  ) => Promise<string | null>;
  getAiCompletion: (
    systemPrompt: string,
    conversation: MessageInput[],
    tools: ToolsAI[]
  ) => Promise<string>;
};
