import DiscordClient from './clients/discord-client';
import './healthcheck';

const myDiscord = new DiscordClient();
myDiscord.init();
