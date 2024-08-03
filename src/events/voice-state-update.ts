import EventDiscord from "../clients/events-discord";
import { Events } from "discord.js";

export default class VoiceStateUpdate extends EventDiscord {
  eventName = Events.VoiceStateUpdate;
  handler = (object: any) => {
    if (object.member.user.bot) {
      console.log("Bot connected on voice channel " + object.channel);
    }
  };
}
