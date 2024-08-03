import DiscordClient from '../clients/discord-client.js';
import EventDiscord from '../clients/events-discord';
import { Events } from 'discord.js';

export default class Ready extends EventDiscord {
  eventName = Events.ClientReady;
  once = true;
  handler = () => {
    console.log(`Ready! Logged in as ${this.client.user?.tag}`);
  };
}
