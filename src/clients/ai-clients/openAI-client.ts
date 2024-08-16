import OpenAI from 'openai';
import { AIClientType } from '../../types/AIClientType';
import { MessageInput, AITool } from '../../types/types';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
import ConfigManager from '../../configManager';
import { tools } from '../../tools';

type openAIImageSize =
  | '1024x1024'
  | '256x256'
  | '512x512'
  | '1792x1024'
  | '1024x1792'
  | null
  | undefined;

export default class OpenAIClient implements AIClientType {
  private imageSize: openAIImageSize;
  client: OpenAI;
  openAIConfig = ConfigManager.config.openAI;

  constructor() {
    this.imageSize = this.openAIConfig.imageSize as openAIImageSize;
    this.client = new OpenAI({
      apiKey: this.openAIConfig.apiKey
    });
  }

  private async message(
    option: ChatCompletionCreateParamsNonStreaming
  ): Promise<string | null> {
    if (!this.client) return null;

    const response = await this.client.chat.completions.create(option);
    return response?.choices[0]?.message?.content || null;
  }

  async generateImage(prompt: string): Promise<string | null> {
    if (!this.client) return null;

    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: this.imageSize
    });
    return response?.data[0]?.url || null;
  }

  async getSummary(
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string | null> {
    const options = {
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      model: this.openAIConfig.summaryModel
    };

    const response = await this.message(options);
    return response;
  }

  async getAiCompletion(
    systemPrompt: string,
    messages: MessageInput[]
  ): Promise<string> {
    const options = {
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      model: this.openAIConfig.model,
      tools: tools.filter(
        (tool) => tool.function.name === 'generate_image_with_dall_e'
      ),
      response_format: { type: 'json_object' }
    };
    console.log(options);
    const runner = this.client.beta.chat.completions.runTools(options);
    const response = await runner.finalContent();
    console.log('response', response);
    return JSON.parse(response as string).content;
  }

  transformTools(tools: AITool[]): string {
    return tools
      .map((tool) => {
        return `TOOL:"""${tool}"""\n`;
      })
      .join('');
  }
}
