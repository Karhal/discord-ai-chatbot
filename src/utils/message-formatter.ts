import { MessageInput } from '../types/types';

interface FormattedMessage {
  role: string;
  content: string;
}

export class MessageFormatter {
  formatLastMessages(messages: MessageInput[], channelId: string): FormattedMessage[] {
    if (!messages.length) return [];

    const formattedMessages: FormattedMessage[] = [];
    const currentUserMessages: string[] = [];

    for (const msg of messages) {
      const { content, author } = this.parseMessageContent(msg);

      if (this.isAssistantMessage(msg)) {
        this.addAccumulatedUserMessages(currentUserMessages, formattedMessages);
        formattedMessages.push(this.createAssistantMessage(content));
      }
      else {
        currentUserMessages.push(this.formatUserMessage(author, content));
      }
    }

    this.addAccumulatedUserMessages(currentUserMessages, formattedMessages);
    return formattedMessages;
  }

  formatFirstMessages(messages: MessageInput[], channelId: string): FormattedMessage[] {
    return [{
      role: 'user',
      content: messages.map(msg => {
        const { content, author } = this.parseMessageContent(msg);
        return this.formatUserMessage(author, content);
      }).join('\n')
    }];
  }

  private parseMessageContent(message: MessageInput): { content: string; author: string } {
    try {
      const parsed = JSON.parse(message.content);
      return { content: parsed.content, author: parsed.author };
    }
    catch {
      return { content: message.content, author: 'user' };
    }
  }

  private isAssistantMessage(message: MessageInput): boolean {
    return message.role === 'assistant';
  }

  private createAssistantMessage(content: string): FormattedMessage {
    return {
      role: 'assistant',
      content
    };
  }

  private formatUserMessage(author: string, content: string): string {
    return `${author}: ${content}`;
  }

  private addAccumulatedUserMessages(
    currentUserMessages: string[],
    formattedMessages: FormattedMessage[]
  ): void {
    if (currentUserMessages.length > 0) {
      formattedMessages.push({
        role: 'user',
        content: currentUserMessages.join('\n')
      });
      currentUserMessages.length = 0;
    }
  }
}