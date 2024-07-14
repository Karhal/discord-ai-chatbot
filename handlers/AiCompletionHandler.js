
const { tools, readMemory } = require('../tools');
const { aiClient } = require('../clients/ai-client');
const { prompt } = require('../config.json');

class messageObject {
  constructor(role, content) {
    this.role = role;
    this.content = content;
  }
}

class AiCompletionHandler {
  
  constructor(aiClient, prompt, tools) {
    this.aiClient = aiClient;
    this.prompt = prompt;
    this.tools = tools;
    this.messagesArray = [];
    this.conversation = [];
    this.summary = null;
  }

  async generateSummary(conversation) {

    this.conversation = conversation;

    const response =  await this.aiClient.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Craft a short summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects. Rely strictly on the provided text, without including external information. Format the summary in one paragraph form for easy understanding.', }, 
        { role: 'user', content: conversation.slice(0, Math.ceil(conversation.length / 2)).join("\n\n"), }
      ],
      model: 'gpt-4o',
    });
    this.summary = response.choices[0].message.content;
  }

  async getAiCompletion() {

    const memory = await readMemory();
    this.fullPrompt = `${this.prompt}. [PERSISTENT INFORMATION] ${memory} [END OF PERSISTENT INFORMATION]. [START OF SUMMARY] ${this.summary }. Please react to the last message only`;
    this.messagesArray.push(new messageObject('assistant', this.fullPrompt));
    for (let i = Math.ceil(this.conversation.length / 2); i < this.conversation.length; i++) {
      this.messagesArray.push(new messageObject('user', this.conversation[i]));
    }

    console.log(this.summary);
    console.log(this.messagesArray);
    const runner = this.aiClient.beta.chat.completions
      .runTools({
        model: 'gpt-4o',
        messages: this.messagesArray,
      tools: this.tools,
    })
    .on('message', () => {});

    return await runner.finalContent();
  }
}

const aiCompletionHandler = new AiCompletionHandler(aiClient, prompt, tools);

module.exports = aiCompletionHandler;