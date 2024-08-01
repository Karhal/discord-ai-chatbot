import { readMemory } from '../tools.js';
import config from '../config.js';

const openAiModel = config.openAI.model || process.env.OPEN_AI_MODEL;
const openAiSummaryModel = config.openAI.summaryModel || process.env.OPEN_AI_SUMMARY_MODEL || openAiModel;
const lang = config.discord.lang || process.env.LANG;
const maxHistory = config.discord.maxHistory || process.env.MAX_HISTORY;

class AiCompletionHandler {
  
  constructor(aiClient, prompt, tools) {
    this.aiClient = aiClient;
    this.prompt = prompt;
    this.tools = tools;
    this.messages = [];
    this.summary = null;
  }

  async getSummary(channelId) {
        console.log('called summary with:');
        console.log(this.getFirstMessagesOfAChannel(5, channelId).map(msg => `${msg.author}: ${msg.content}`).join("\n\n"));
        const option = {
          messages: [
            { role: 'assistant', content: 'Craft a short summary of the given conversation that is detailed while maintaining clarity and conciseness. Rely strictly on the provided text. Format the summary in one paragraph form for easy understanding. The summary has to be the shortest possible (<100 words) and give a good idea of what the discussion is about. Use the following language: '+ lang +'\n\nText:"""', }, 
            { role: 'user', content: this.getFirstMessagesOfAChannel(5, channelId).map(msg => `${msg.author}: ${msg.content}`).join("\n\n"), 
            },
          ],
          model: openAiSummaryModel
        };

        const response = await this.aiClient.message(option);
        return response;
  }

  async getAiCompletion(summary, channelId) {

    const memory = readMemory();
    const fullPrompt = `${this.prompt}.\n\n
    MEMORY:"""\n${memory}\n"""\n
    PREVIOUSLY:"""\n${summary }\n"""
    NOTE:"""\n
    - Format your response in a JSON object with the key 'content' and the key 'author'.
    - When you use a tool, use the property 'content' to store its results.
    - Interract only to the last message mentionning you. The rest is to give you context.
    - Consider the DateTime given with the last message to avoid being out of context.\n"""
    `;
    let conversation = [{ role: 'assistant', content: fullPrompt }];
    conversation = conversation.concat(this.getLastMessagesOfAChannel(5, channelId));

    console.log('conversation:');
    console.log(conversation);

    const option = {
      model: openAiModel,
      messages: conversation,
      tools: this.tools,
      response_format: { type: "json_object" }
    };
    
    const runner = this.aiClient.client.beta.chat.completions.runTools(option);
    let response = await runner.finalContent();
    response = JSON.parse(response.replace(/^[a-zA-Z]*:/g, ''));
    return response;
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
            const contentJsonAsString = JSON.stringify({"author": msg.author.username, "content": msg.content, "dateTime": msg.createdAt});
            messages.push({ role: role, content: contentJsonAsString, channelId: msg.channelId });
        }
    });

    return messages;
  }
}

export default AiCompletionHandler;