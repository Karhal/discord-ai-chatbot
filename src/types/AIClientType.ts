import OpenAI from 'openai';
import { MessageInput } from './types';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';

export type AIClientType = {
  client: OpenAI;
  message: (
    option: ChatCompletionCreateParamsNonStreaming
  ) => Promise<string | null>;
  generateImage: (prompt: string) => Promise<string | null>;
  getSummary: (messages: MessageInput[]) => Promise<string | null>;
};
