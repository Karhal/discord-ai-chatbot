import { tools, readMemory } from '../tools.js';
import { aiClient } from '../clients/ai-client.js';
import config from '../config.js';

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
        console.log('called summary with:');
        console.log(this.getFirstMessagesOfAChannel(5, channelId).map(msg => `${msg.author}: ${msg.content}`).join("\n\n"));
        this.aiClient.chat.completions.create({
          messages: [
            { role: 'assistant', content: 'Craft a short summary of the given conversation that is detailed while maintaining clarity and conciseness. Rely strictly on the provided text. Format the summary in one paragraph form for easy understanding. The summary has to be the shortest possible (<100 words) and give a good idea of what the discussion is about. Use the following language: '+ lang +'\n\nText:"""', }, 
            { role: 'user', content: this.getFirstMessagesOfAChannel(5, channelId).map(msg => `${msg.author}: ${msg.content}`).join("\n\n"), 
            },
          ],
          model: openAiSummaryModel,
        }).then((response) => {
          console.log(response.choices[0].message.content);
          resolve(response.choices[0].message.content);
        });

      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }


  getAiCompletion(summary, channelId) {

    const memory = readMemory();
    const fullPrompt = `${this.prompt}.\n\n
    MEMORY:"""\n${memory}\n"""\n
    PREVIOUSLY:"""\n${summary }\n"""
    NOTE:"""\nFormat your response in a JSON object with the key 'content' and the key 'author'.\n"""
    NOTE:"""\nInterract only to the last message mentionning you. The rest is to give you context.\n"""
    `;
    let conversation = [{ role: 'assistant', content: fullPrompt }];
    conversation = conversation.concat(this.getLastMessagesOfAChannel(5, channelId));
    console.log('conversation:');
    console.log(conversation);
    return new Promise(async (resolve, reject) => {

        const runner = this.aiClient.beta.chat.completions
          .runTools({
            model: openAiModel,
            messages: conversation,
            tools: this.tools,
            response_format: { type: "json_object" }
          });
        let response = await runner.finalContent();
        response = JSON.parse(response.replace(/^[a-zA-Z]*:/g, ''));
        resolve(response);
      });
  }

  addMessageToChannel(message, limit = maxHistory) {
    let channelMessages = this.messages.filter(msg => msg.channelId === message.channelId);

    channelMessages.push(message);
    if (channelMessages.length > limit) {
      channelMessages.shift();
    }
    this.messages = this.messages.filter(msg => msg.channelId !== message.channelId);
    this.messages = [...channelMessages, ...this.messages];
  }

  addMessageArrayToChannel(messages, limit = maxHistory) {
    messages.forEach(message => {
      this.addMessageToChannel(message, limit);
    });
  }

  eraseMessagesWithChannelId(channelId) {
    this.messages = this.messages.filter(msg => msg.channelId !== channelId);
  }

  getLastMessagesOfAChannel(count, channelId) {
    return this.messages.filter(msg => msg.channelId === channelId).slice(-count);
  }

  getFirstMessagesOfAChannel(count, channelId) {
    return this.messages.filter(msg => msg.channelId === channelId).slice(0, count);
  }

  setChannelHistory(channelId, messages) {
    this.eraseMessagesWithChannelId(channelId);
    const handlerMessages = this.createMessagesArrayFromHistory(messages);
    this.addMessageArrayToChannel(handlerMessages);
  }

  createMessagesArrayFromHistory(messagesChannelHistory) {

    let messages = [];
    messagesChannelHistory.reverse().forEach(msg => {
        if(msg.content !== '') {
            const role = msg.author.bot ? 'assistant' : 'user';
            messages.push({ role: role, content: msg.content, dateTime: msg.createdAt, channelId: msg.channelId, author: msg.author.username });
        }
    });

    return messages;
  }
}

const aiCompletionHandler = new AiCompletionHandler(aiClient, prompt, tools);

export default aiCompletionHandler;