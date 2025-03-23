import { AIClientType } from '../../types/AIClientType';
import { MessageInput, AITool } from '../../types/types';
import ConfigManager from '../../configManager';
import { EventEmitter } from 'events';
import ImageHandler from '../../handlers/image-handler';

interface FlowiseResponse {
  text?: string;
  agentReasoning?: Array<{
    usedTools?: Array<{
      toolOutput?: string;
    }>;
  }>;
}

export default class FlowiseClient extends EventEmitter implements AIClientType {
  private flowiseConfig = ConfigManager.config.flowise;
  private imageHandler = new ImageHandler();

  private isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  private extractUrlsFromImgTags(text: string): string[] {
    const imgRegex = /<img[^>]+src=['"]([^'"]+)['"]/g;
    const matches = text.matchAll(imgRegex);
    return Array.from(matches)
      .map(match => match[1])
      .filter(url => this.isImageUrl(url));
  }

  private extractUrlsFromText(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
    const matches = text.matchAll(urlRegex);
    return Array.from(matches)
      .map(match => match[1].replace(/\\n/g, '').replace(/\\/g, ''))
      .filter(url => this.isImageUrl(url));
  }

  private extractUrlsFromJson(jsonText: string): string[] {
    try {
      const parsedOutput = JSON.parse(jsonText);
      if (!parsedOutput?.response) {
        return [];
      }
      return this.extractUrlsFromText(parsedOutput.response);
    } catch {
      return [];
    }
  }

  private extractImageUrls(toolOutput: string): string[] {
    const imgTagUrls = this.extractUrlsFromImgTags(toolOutput);
    const jsonUrls = this.extractUrlsFromJson(toolOutput);
    const directUrls = this.extractUrlsFromText(toolOutput);

    return [...new Set([...imgTagUrls, ...jsonUrls, ...directUrls])];
  }

  private cleanResponseText(text: string, downloadedImageUrls: string[]): string {
    let cleanedText = text;

    downloadedImageUrls.forEach(imageUrl => {
      const markdownRegex = new RegExp(`!\\[([^\\]]*)\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      cleanedText = cleanedText.replace(markdownRegex, '');
      cleanedText = cleanedText.replace(imageUrl, '');
    });

    return cleanedText.replace(/\n\s*\n\s*\n/g, '\n\n');
  }

  private async message(systemPrompt: string, messages: MessageInput[]): Promise<string | null> {
    if (messages.length === 0) {
      throw new Error('No messages provided');
    }

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'apiMessage' : 'userMessage',
        content: msg.content
      }));

      const requestBody = {
        question: messages[messages.length - 1].content,
        overrideConfig: {
          agentName: this.flowiseConfig.agentName,
          vars: {
            user_prompt: systemPrompt
          }
        },
        history: history
      };

      const response = await fetch(
        `${this.flowiseConfig.apiUrl}/api/v1/prediction/${this.flowiseConfig.flowId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.flowiseConfig.apiKey}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as FlowiseResponse;
      if (!data) {
        throw new Error('Empty response from Flowise');
      }

      const imageUrls: string[] = [];

      if (data.agentReasoning) {
        for (const reasoning of data.agentReasoning) {
          if (!reasoning?.usedTools) continue;

          for (const tool of reasoning.usedTools) {
            if (!tool?.toolOutput) continue;

            try {
              const urls = this.extractImageUrls(tool.toolOutput);
              imageUrls.push(...urls);
            }
            catch (error) {
              console.error('Error extracting image URLs:', error);
            }
          }
        }
      }

      if (imageUrls.length > 0) {
        console.log('Found image URLs:', imageUrls);
        await this.imageHandler.downloadImages(imageUrls);
        
        if (data.text) {
          data.text = this.cleanResponseText(data.text, imageUrls);
        }
      }

      if (!data.text) {
        throw new Error('Response missing required text field');
      }

      console.log('Flowise response:', JSON.stringify({
        text: data.text,
        agentReasoning: data.agentReasoning?.map(reasoning => ({
          usedTools: reasoning.usedTools
        }))
      }, null, 2));

      return data.text;
    } catch (error) {
      console.error('Error with Flowise:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message
        });
      }
      throw error;
    }
  }

  async getAiCompletion(systemPrompt: string, messages: MessageInput[], tools: AITool[]): Promise<string> {
    const response = await this.message(ConfigManager.config.AIPrompt, messages);
    if (!response) {
      throw new Error('No response from Flowise');
    }
    return response;
  }
}
