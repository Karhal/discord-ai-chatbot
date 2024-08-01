import DiscordClient from './clients/discord-client.js';
import config from './config.js';

const myDiscord = new DiscordClient(config?.discord?.token || process.env.DISCORD_TOKEN || '');
myDiscord.init();
