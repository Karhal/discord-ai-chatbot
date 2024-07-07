const fs = require('node:fs');
const path = require('node:path');
const { discordClient } = require('./clients/discord-client');
const { discordToken } = require('./config.json');
require('dotenv').config();

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		discordClient.once(event.name, (...args) => event.execute(...args));
	} else {
		discordClient.on(event.name, (...args) => event.execute(...args));
	}
}
discordClient.login(discordToken || process.env.DISCORD_TOKEN);