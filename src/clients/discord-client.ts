import { Client, GatewayIntentBits } from 'discord.js';
import Ready from '../events/ready';
import MessageCreate from '../events/message-create';

export default class DiscordClient {
  ready: boolean;
  client: Client;
  login: string;

  constructor(login: string) {
    this.ready = false;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });
    this.login = login;
  }

  async init() {
    await this.loadEvents();
    this.loginClient();
    this.ready = true;
    return true;
  }

  async loadEvents() {
    this.client.once('ready', (event) => {
      const ready = new Ready(this.client);
      ready.handler();
    });

    this.client.once('messageCreate', (event) => {
      const ready = new MessageCreate(this.client);
      ready.handler(event);
    });

    return true;
  }

  loginClient() {
    this.client.login(this.login);
  }
}
