import DiscordClient from './clients/discord-client.js';
import config from './config.js';

const myDiscord = new DiscordClient(config.discordToken || process.env.DISCORD_TOKEN);
myDiscord.init();
