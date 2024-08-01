import OpenAI from 'openai';
import config from '../config.js';

export default class AIClient {
    static openAiKey = config.openaiKey || process.env.OPENAI_API_KEY;
    static imageSize = config.imageSize || process.env.IMAGE_SIZE || "1024x1024";

    constructor(){
      if(!AIClient.openAiKey){
        console.log('No Open AI key configured');
      }
      else {
        this.client = new OpenAI({
          apiKey: AIClient.openAiKey
        });
      }
    }

    async message(option){
        if(!this.client)
            return null;

        const response = await this.client.chat.completions.create(option);
        return response?.choices[0]?.message?.content || null;
    }

    async generateImage(prompt){
        if(!this.client)
            return null;

        const response = await this.client.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: AIClient.imageSize
        });
        return { "response": response?.data[0]?.url || null };
    }
}
