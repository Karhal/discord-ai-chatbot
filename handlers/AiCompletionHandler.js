
const tools = require('../tools');
const { aiClient } = require('../clients/ai-client');
const { prompt } = require('../config.json');

class AiCompletionHandler {
  
  constructor(aiClient, prompt, tools) {
    this.aiClient = aiClient;
    this.prompt = prompt;
    this.tools = tools;
  }

  async getAiSummary(conversation) {
    return await this.aiClient.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Fais un résumé de cette discussion: ', },
        { role: 'user', content: conversation, }
      ],
      model: 'gpt-4o',
    });
  }

  async getAiCompletion(username, message, conversationSummary) {
    const userMessage = `${username}: ${message}`;

    const runner = this.aiClient.beta.chat.completions
      .runTools({
        model: 'gpt-4o',
        messages: [
          {
            role: 'assistant',
            content: `${this.prompt} The context of the conversation is: ${conversationSummary} END OF CONTEXT. Please react to the last message only`
          },
          {
            role: 'user',
            content: userMessage,
        }
    ],
      tools: this.tools,
    })
    .on('message', () => {});

    return await runner.finalContent();
  }
}

const aiCompletionHandler = new AiCompletionHandler(aiClient, prompt, tools);

module.exports = aiCompletionHandler;