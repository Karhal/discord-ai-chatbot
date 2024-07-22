import { tools, readMemory } from '../tools.js';
import { aiClient } from '../clients/ai-client.js';
import config from '../config.json' assert { type: 'json' };

const prompt = process.env.PROMPT || config.prompt;
const openAiModel = process.env.OPEN_AI_MODEL || config.openAiModel;
const openAiSummaryModel = process.env.OPEN_AI_SUMMARY_MODEL || config.openAiSummaryModel || openAiModel;
const lang = process.env.LANG || config.lang;
const maxHistory = process.env.MAX_HISTORY || config.maxHistory;

class AiCompletionHandler {
  
  constructor(aiClient, prompt, tools) {
    this.aiClient = aiClient;
    this.prompt = prompt;
    this.tools = tools;
    this.messages = [];
    this.summary = null;
  }

  getSummary(channelId) {

    return new Promise((resolve, reject) => {
      try {
        console.log('summary prompt');
        console.log(this.messages.filter(msg => msg.channelId === channelId).slice(0, maxHistory - 5 ).map(msg => `${msg.author}: ${msg.content}`).join("\n\n"));
        this.aiClient.chat.completions.create({
          messages: [
            { role: 'assistant', content: 'Craft a short summary of the given conversation that is detailed while maintaining clarity and conciseness. Rely strictly on the provided text. Format the summary in one paragraph form for easy understanding. The summary has to be the shortest possible (<100 words) and give a good idea of what the discussion is about. Use the following language: '+ lang +'\n\nText:"""', }, 
            { role: 'user', content: this.messages.filter(msg => msg.channelId === channelId).slice(0, maxHistory - 5 ).map(msg => `${msg.author}: ${msg.content}`).join("\n\n"), },
          ],
          model: openAiSummaryModel,
        }).then((response) => {
          resolve(response.choices[0].message.content);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  getAiCompletion(summary, channelId) {

    const memory = readMemory();
    const fullPrompt = `${this.prompt}.\n\nMEMORY:"""\n${memory}\n"""\n\nRECAP:"""\n${summary }\n"""\n\nOBLIGATORY:"""\nIn this conversation messages are prefixed with the nickname of the user. Do NOT imitate this and write the content of your response only. React to the last message only. Write your response only, do NOT add your name."""`;
    let conversation = [{ role: 'assistant', content: fullPrompt }];
    conversation = conversation
    .concat(this.messages
    .filter(msg => msg.channelId === channelId).slice(-5)
    .map(msg => ({ role: msg.role, content: msg.content }))); 

    console.log('sent conversation:');
    console.log(conversation);
    console.log('End of conversation');
    return new Promise((resolve, reject) => {

        const runner = this.aiClient.beta.chat.completions
          .runTools({
            model: openAiModel,
            messages: conversation,
            tools: this.tools,
          })
          .on('message', () => {});

        resolve(runner.finalContent());
      });
  }
}

const aiCompletionHandler = new AiCompletionHandler(aiClient, prompt, tools);

export default aiCompletionHandler;