import EventDiscord from "../clients/events-discord.js";
import { Events } from "discord.js";

export default class VoiceStateUpdate extends EventDiscord {
  eventName = Events.VoiceStateUpdate;
  handler = function execute(object: any) {
    if (object.member.user.bot) {
      console.log("Bot connected on voice channel " + object.channel);
    }
  };
}
