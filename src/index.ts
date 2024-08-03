import DiscordClient from './clients/discord-client';
import config from './config';

const myDiscord = new DiscordClient(
	config?.discord?.token || process.env.DISCORD_TOKEN || '',
);
myDiscord.init();
