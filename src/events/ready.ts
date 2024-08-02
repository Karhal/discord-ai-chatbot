import EventDiscord from "../clients/events-discord.js";
import { Events } from "discord.js";

export default class Ready extends EventDiscord {
  eventName = Events.ClientReady;
  once = true;
  handler = function execute(client: any) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  };
}
