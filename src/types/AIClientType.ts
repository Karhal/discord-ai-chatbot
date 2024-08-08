import OpenAI from 'openai';
import { MessageInput, ToolsAI } from './types';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
import { Mistral } from '@mistralai/mistralai';
import { ChatCompletionRequest } from '@mistralai/mistralai/models/components';

export type AIClientType = {
  client: OpenAI | Mistral;
  message: (
    option: ChatCompletionCreateParamsNonStreaming | ChatCompletionRequest
  ) => Promise<string | null>;
  generateImage?: (prompt: string) => Promise<string | null>;
  getSummary: (messages: MessageInput[]) => Promise<string | null>;
  getAiCompletion: (
    conversation: MessageInput[],
    tools: ToolsAI[]
  ) => Promise<string>;
};
