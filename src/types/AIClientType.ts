import OpenAI from "openai";

export type AIClientType = {
  client: OpenAI;
  message: (
    option: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
  ) => Promise<string | null>;
  generateImage: (prompt: string) => Promise<string | null>;
};
