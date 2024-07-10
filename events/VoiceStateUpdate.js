const { Events } = require('discord.js');
const { botName, maxHistory } = require('../config.json');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

module.exports = {
	name: Events.VoiceStateUpdate,
	once: false,
	execute(object) {
		if (object.member.user.bot) {
			console.log('Bot connected on voice channel ' + object.channel);
			
		} else {
			// Last connection is not from the bot
			// Add your logic here
		}
        //console.log(object);
	},
};