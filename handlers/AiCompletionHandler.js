import { tools, readMemory } from '../tools.js';
import { aiClient } from '../clients/ai-client.js';
import config from '../config.json' assert { type: 'json' };

const prompt = process.env.PROMPT || config.prompt;
const openAiModel = process.env.OPEN_AI_MODEL || config.openAiModel;
const openAiSummaryModel = process.env.OPEN_AI_SUMMARY_MODEL || config.openAiSummaryModel || openAiModel;
const lang = process.env.LANG || config.lang;
const maxHistory = process.env.MAX_HISTORY || config.maxHistory;

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
            { role: 'assistant', content: 'Craft a short summary of the given conversation that is detailed while maintaining clarity and conciseness. Rely strictly on the provided text, without including external information. Format the summary in one paragraph form for easy understanding. Use the following language : '+ lang, }, 
            { role: 'user', content: conversation.slice(0, maxHistory - 5 ).join("\n\n") }
          ],
          model: openAiSummaryModel,
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

      readMemory().then((memory) => {
        this.fullPrompt = `${this.prompt}.\n\n[PERSISTENT INFORMATION]\n${memory}\n[END OF PERSISTENT INFORMATION]\n\n[CONVERSATION RECAP]\n${this.summary }\n[END OF SUMMARY]\n\nPlease react to the last message only`;
        this.messagesArray.push(new messageObject('assistant', this.fullPrompt));
        console.log("Conversation:");
        console.log(this.conversation);
        for (let i = this.conversation.length - 5; i < this.conversation.length; i++) {
          if(this.conversation[i] !== undefined) {
            this.messagesArray.push(new messageObject('user', this.conversation[i]));
          }
        }
  
        const runner = this.aiClient.beta.chat.completions
          .runTools({
            model: openAiModel,
            messages: this.messagesArray,
            tools: this.tools,
          })
          .on('message', () => {});
  
        const completion = runner.finalContent();
        console.log(this.messagesArray);
        resolve(completion);
      });
    });
  }
}

const aiCompletionHandler = new AiCompletionHandler(aiClient, prompt, tools);

export default aiCompletionHandler;