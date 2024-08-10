import { Client, GatewayIntentBits } from 'discord.js';
import Ready from '../events/ready';
import MessageCreate from '../events/message-create';
import AIClient from './ai-client';
import ConfigManager, { DiscordConfigType } from '../configManager';

export default class DiscordClient {
  discordClient: Client;
  private discordConfig: DiscordConfigType;
  aiClient: AIClient = new AIClient();
  private ready: boolean = false;
  constructor() {
    this.discordConfig = ConfigManager.getConfig().discord;
    this.discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
      ]
    });
  }

  async init() {
    await this.loadEvents();
    this.loginDiscord();
    this.ready = true;
    return true;
  }

  async loadEvents() {
    this.discordClient.once('ready', () => {
      const eventHandler = new Ready(this.discordClient, this.aiClient);
      eventHandler.handler();
    });

    this.discordClient.on('messageCreate', (event) => {
      const eventHandler = new MessageCreate(this.discordClient, this.aiClient);
      eventHandler.handler(event);
    });

    return true;
  }

  loginDiscord() {
    this.discordClient.login(this.discordConfig.token);
  }
}
