import EventDiscord from '../clients/events-discord';
import { Events } from 'discord.js';
import FileHandler from '../handlers/file-handler';
import ConfigManager from '../configManager';
export default class Ready extends EventDiscord {
  eventName = Events.ClientReady;
  once = true;
  handler = () => {
    FileHandler.createFolder(ConfigManager.config.tmpFolder.path);
    console.log(`Ready! Logged in as ${this.discordClient?.user?.tag}`);
  };
}
