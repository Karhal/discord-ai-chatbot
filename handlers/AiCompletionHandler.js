import { tools, readMemory } from '../tools.js';
import { aiClient } from '../clients/ai-client.js';
import config from '../config.json' assert { type: 'json' };

const prompt = process.env.PROMPT || config.prompt;
const openAiModel = process.env.OPEN_AI_MODEL || config.openAiModel;
const lang = process.env.LANG || config.lang;

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

  generateSummary(conversation) {
    return new Promise((resolve, reject) => {
      this.conversation = conversation;

      try {
        const response = this.aiClient.chat.completions.create({
          messages: [
            { role: 'assistant', content: 'Craft a short summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects. Rely strictly on the provided text, without including external information. Format the summary in one paragraph form for easy understanding. Use the followgin language : '+ lang, }, 
            { role: 'user', content: conversation.slice(0, Math.ceil(conversation.length / 2)).join("\n\n"), }
          ],
          model: openAiModel,
        }).then((response) => {
          this.summary = response.choices[0].message.content;
          resolve();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  getAiCompletion() {
    return new Promise((resolve, reject) => {

      const memory = readMemory().then((memory) => {
        this.fullPrompt = `${this.prompt}. [PERSISTENT INFORMATION] ${memory} [END OF PERSISTENT INFORMATION]. [START OF SUMMARY] ${this.summary }. Please react to the last message only`;
        this.messagesArray.push(new messageObject('assistant', this.fullPrompt));
        for (let i = Math.ceil(this.conversation.length / 2); i < this.conversation.length; i++) {
          this.messagesArray.push(new messageObject('user', this.conversation[i]));
        }
  
        const runner = this.aiClient.beta.chat.completions
          .runTools({
            model: openAiModel,
            messages: this.messagesArray,
            tools: this.tools,
          })
          .on('message', () => {});
  
        const completion = runner.finalContent();
        console.log(this.fullPrompt);
        console.log(this.messagesArray);
        resolve(completion);
      });
    });
  }
}

const aiCompletionHandler = new AiCompletionHandler(aiClient, prompt, tools);

export default aiCompletionHandler;