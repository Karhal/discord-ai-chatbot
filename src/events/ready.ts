import DiscordClient from '../clients/discord-client.js';
import EventDiscord from '../clients/events-discord';
import { Events } from 'discord.js';
import { ConsoleLogger } from '../console-logger.js';

export default class Ready extends EventDiscord {
  eventName = Events.ClientReady;
  once = true;
  handler = () => {
    ConsoleLogger.log(
      'INFOS',
      `Ready! Logged in as ${this.discordClient?.user?.tag}`
    );
  };
}
