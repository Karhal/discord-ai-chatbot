import { Client, GatewayIntentBits } from "discord.js";
import { join, dirname } from "path";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";

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
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const eventsPath = join(__dirname, "..", "events");
    const eventFiles = readdirSync(eventsPath).filter((file) =>
      file.endsWith(".js"),
    );

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      try {
        const myModule = await import(filePath);
        new myModule.default(this.client).init();
      } catch (ex) {
        console.log("Error on loading event " + file, ex);
      }
    }

    return true;
  }

  loginClient() {
    this.client.login(this.login);
  }
}
