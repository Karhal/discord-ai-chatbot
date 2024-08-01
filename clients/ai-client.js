import OpenAI from 'openai';
import config from '../config.js';

export default class AIClient {
    static openAiKey = config.openaiKey || process.env.OPENAI_API_KEY;
    static imageSize = config.imageSize || process.env.IMAGE_SIZE;

    constructor(){
      this.client = new OpenAI({
          apiKey: AIClient.openAiKey
      });
    }

    async message(option){
        const response = await this.client.chat.completions.create(option);
        return response?.choices[0]?.message?.content || false;
    }

    async generateImage(prompt){
      const response = await this.client.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: AIClient.imageSize,
      });
      return { "response": response?.data[0]?.url || null };
    }
}
