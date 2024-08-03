import AiCompletionHandler from "../handlers/ai-completion-handler";
import AIClient from "../clients/ai-client";
import { tools } from "../tools";
import config from "../config";
import EventDiscord from "../clients/events-discord";
import ImageHandler from "../handlers/image-handler";
import { Collection, Events, Message } from "discord.js";

export default class MessageCreate extends EventDiscord {
  eventName: Events = Events.MessageCreate;
  handler = async (message: Message): Promise<void> => {
    const maxHistory: number = config.discord.maxHistory;
    console.log(this?.client?.user?.id);
    if (
      !this.theMessageContainsBotName(message) ||
      message.author.id === this?.client?.user?.id
    ) {
      console.debug("Message does not contain bot name or is from bot.");
      return;
    }

    const channelId: string = message.channelId;
    const messagesChannelHistory: Collection<
      string,
      Message<boolean>
    > = await message.channel.messages.fetch({
      limit: maxHistory,
    });
    message.channel.sendTyping();

    const aiCompletionHandler = new AiCompletionHandler(
      new AIClient(),
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
      const content = completion.content;

      const image = new ImageHandler(message, content);
      const images: string[] = await image.getImages();

      message.channel.sendTyping();
      await this.sendResponse(message, content, images);
      if (images && images.length > 0) {
        image.deleteImages(images);
      }
    }

    console.log("Done.");
  };

  async sendResponse(
    message: Message,
    response: string,
    imagePaths: string[]
  ): Promise<boolean> {
    response = response.trim().replace(/\n\s*\n/g, "\n");
    message.channel.send(response);
    if (imagePaths.length > 0) {
      await message.channel.send({ files: imagePaths });
      console.log("Images sent");
    }
    return true;
  }

  theMessageContainsBotName(message: Message): boolean {
    const botName = config.discord.botName;
    return message.content.toLowerCase().includes(botName.toLowerCase());
  }
}
