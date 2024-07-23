import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discordClient } from './clients/discord-client.js';
import config from './config.json' with { type: 'json' };
const { discordToken } = config;

import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
	import(filePath).then(module => {
		const event = module.event || module.default;
		console.log(event);
		if (event.once) {
			discordClient.once(event.name, (...args) => event.execute(...args));
		} else {
			discordClient.on(event.name, (...args) => event.execute(...args));
		}
	}).catch(error => console.error(`${file}:`, error));
}
discordClient.login(discordToken || process.env.DISCORD_TOKEN);