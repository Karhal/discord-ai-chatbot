import AiCompletionHandler from '../handlers/ai-completion-handler';
import { tools } from '../tools';
import config from '../config';
import EventDiscord from '../clients/events-discord';
import ImageHandler from '../handlers/image-handler';
import { Collection, Events, Message } from 'discord.js';

export default class MessageCreate extends EventDiscord {
  eventName: Events = Events.MessageCreate;
  handler = async (message: Message): Promise<void> => {
    const maxHistory: number = config.discord.maxHistory;
    if (
      !this.theMessageContainsBotName(message) ||
      message.author.id === this.discordClient?.user?.id
    ) {
      return;
    }

    const channelId: string = message.channelId;
    const messagesChannelHistory: Collection<
      string,
      Message<boolean>
    > = await message.channel.messages.fetch({
      limit: maxHistory
    });
    message.channel.sendTyping();

    const aiCompletionHandler = new AiCompletionHandler(
      this.aiClient,
      config.openAI.prompt,
      tools
    );

    aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);

    const summary = await aiCompletionHandler.getSummary(channelId);
    if (summary) {
      const completion = await aiCompletionHandler.getAiCompletion(
        summary,
        channelId
      );
      let content = completion.content;
      console.log('completion', completion);
      const imageHandler = new ImageHandler(this.aiClient);
      const foundImages = await imageHandler.getImages(content);
      await imageHandler.downloadImages(foundImages);
      content = imageHandler.cleanImagePathsFromResponse(content);
      message.channel.sendTyping();
      await this.sendResponse(message, content, imageHandler.downloadedImages);
      imageHandler.deleteImages();
    }

    console.log('Done.');
  };

  async sendResponse(
    message: Message,
    response: string,
    imagePaths: string[]
  ): Promise<boolean> {
    response = response.trim().replace(/\n\s*\n/g, '\n');
    message.channel.send(response);
    if (imagePaths.length > 0) {
      message.channel.sendTyping();
      await message.channel.send({ files: imagePaths });
      console.log('Images sent');
    }
    return true;
  }

  theMessageContainsBotName(message: Message): boolean {
    const botName = this.discordClient.user?.username;
    const botId = this.discordClient.user?.id;
    if (!!botName || !!botId) {
      return (
        (!!botName &&
          message.content.toLowerCase().includes(botName.toLowerCase())) ||
        (!!botId && message.content.toLowerCase().includes('<@' + botId + '>'))
      );
    }
    return false;
  }
}
