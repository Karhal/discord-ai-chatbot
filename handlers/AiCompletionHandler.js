
const { tools, readMemory } = require('../tools');
const { aiClient } = require('../clients/ai-client');
const { prompt } = require('../config.json');

class AiCompletionHandler {
  
  constructor(aiClient, prompt, tools) {
    this.aiClient = aiClient;
    this.prompt = prompt;
    this.tools = tools;
    console.log("TOOLS");
    console.log(this.tools);
  }

  async getAiSummary(conversation) {
    return await this.aiClient.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Craft a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects. Rely strictly on the provided text, without including external information. Format the summary in paragraph form for easy understanding. Conclude your notes with [End of Summary] to indicate completion. Then add the 2 last messages before the last one to complete the summary', }, 
        { role: 'user', content: conversation, }
      ],
      model: 'gpt-4o',
    });
  }

  async getAiCompletion(username, message, conversationSummary) {
    const memory = await readMemory();
    const messageDateTime = new Date().toISOString();
    const userMessage = `${username} [${messageDateTime}]: ${message}`;
    console.log(`${this.prompt}. [PERSISTENT INFORMATION] ${memory} [END OF PERSISTENT INFORMATION]. [START OF SUMMARY] ${conversationSummary}. Please react to the last message only`);
    const runner = this.aiClient.beta.chat.completions
      .runTools({
        model: 'gpt-4o',
        messages: [
          {
            role: 'assistant',
            content: `${this.prompt}. [PERSISTENT INFORMATION] ${memory} [END OF PERSISTENT INFORMATION]. [START OF SUMMARY] ${conversationSummary}. Please react to the last message only`
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