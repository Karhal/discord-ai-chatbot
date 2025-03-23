import { AIClientType } from '../../types/AIClientType';
import { MessageInput, AITool } from '../../types/types';
import ConfigManager from '../../configManager';
import { EventEmitter } from 'events';
import ImageHandler from '../../handlers/image-handler';

export default class FlowiseClient extends EventEmitter implements AIClientType {
  private flowiseConfig = ConfigManager.config.flowise;
  private imageHandler = new ImageHandler();

  private isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  private extractImageUrls(toolOutput: string): string[] {
    const urls: string[] = [];

    // Check for <img> tags first
    const imgRegex = /<img[^>]+src=['"]([^'"]+)['"]/g;
    const imgMatches = toolOutput.matchAll(imgRegex);
    for (const match of imgMatches) {
      if (this.isImageUrl(match[1])) {
        urls.push(match[1]);
      }
    }

    try {
      // Try to parse as JSON and look for URLs in the response field
      const parsedOutput = JSON.parse(toolOutput);
      if (parsedOutput?.response) {
        const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
        const matches = parsedOutput.response.matchAll(urlRegex);
        for (const match of matches) {
          const cleanUrl = match[1].replace(/\\n/g, '').replace(/\\/g, '');
          if (this.isImageUrl(cleanUrl)) {
            urls.push(cleanUrl);
          }
        }
      }
    } catch (e) {
      // If JSON parsing fails, check for direct URLs in the raw text
      const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
      const matches = toolOutput.matchAll(urlRegex);
      for (const match of matches) {
        const cleanUrl = match[1].replace(/\\n/g, '').replace(/\\/g, '');
        if (this.isImageUrl(cleanUrl)) {
          urls.push(cleanUrl);
        }
      }
    }

    return urls;
  }

  private cleanResponseText(text: string, downloadedImageUrls: string[]): string {
    let cleanedText = text;

    downloadedImageUrls.forEach(imageUrl => {
      const markdownRegex = new RegExp(`!\\[([^\\]]*)\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      cleanedText = cleanedText.replace(markdownRegex, '');

      cleanedText = cleanedText.replace(imageUrl, '');
    });

    cleanedText = cleanedText.replace(/\n\s*\n\s*\n/g, '\n\n');

    return cleanedText;
  }

  private async message(systemPrompt: string, messages: MessageInput[]): Promise<string | null> {
    try {
      if (messages.length === 0) {
        throw new Error('No messages provided');
      }

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

      const data = await response.json();
      const imageUrls: string[] = [];

      data?.agentReasoning?.forEach((reasoning: any) => {
        if (!reasoning?.usedTools) return;
        
        reasoning.usedTools.forEach((tool: any) => {
          if (!tool?.toolOutput) return;
          
          try {
            const urls = this.extractImageUrls(tool.toolOutput);
            imageUrls.push(...urls);
          } catch (error) {
            console.error('Error extracting image URLs:', error);
          }
        });
      });

      if (imageUrls.length > 0) {
        console.log('Found image URLs:', imageUrls);
        await this.imageHandler.downloadImages(imageUrls);
        if (data?.text) {
          data.text = this.cleanResponseText(data.text, imageUrls);
        }
      }

      console.log('Flowise response:', JSON.stringify({
        text: data?.text,
        question: data?.question,
        chatId: data?.chatId,
        chatMessageId: data?.chatMessageId,
        sessionId: data?.sessionId,
        memoryType: data?.memoryType,
        agentReasoning: data?.agentReasoning?.map((reasoning: any) => ({
          agentName: reasoning.agentName,
          messages: reasoning.messages,
          usedTools: reasoning.usedTools,
          sourceDocuments: reasoning.sourceDocuments,
          artifacts: reasoning.artifacts,
          state: reasoning.state,
          nodeName: reasoning.nodeName,
          nodeId: reasoning.nodeId
        }))
      }, null, 2));
      return data?.text || null;
    }
    catch (error) {
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
