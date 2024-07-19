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
            { role: 'assistant', content: 'Craft a short summary of the given conversation that is detailed while maintaining clarity and conciseness. Rely strictly on the provided text. Format the summary in one paragraph form for easy understanding. The summary has to be the shortest possible (<100 words) and give a good idea of what the discussion is about. Use the following language : '+ lang, }, 
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
        this.fullPrompt = `${this.prompt}.\n\n[MEMORY]\n${memory}\n[/MEMORY]\n\n[RECAP]\n${this.summary }\n[/RECAP]\n\n OBLIGATORY: React to the last message only. Write only your response, no name, no date no extra data.`;
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