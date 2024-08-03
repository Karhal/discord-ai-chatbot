import { Client, GatewayIntentBits } from "discord.js";
import Ready from "../events/ready";
import MessageCreate from "../events/message-create";

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
    this.client.once("ready", (_event) => {
      const eventHandler = new Ready(this.client);
      console.log("Ready event added");
      eventHandler.handler();
    });

    this.client.on("messageCreate", (event) => {
      const eventHandler = new MessageCreate(this.client);
      console.log("MessageCreate event added");
      eventHandler.handler(event);
    });

    return true;
  }

  loginClient() {
    this.client.login(this.login);
  }
}
