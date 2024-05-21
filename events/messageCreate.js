const { Events } = require('discord.js');
const { getAiCompletion, getAiSummary } = require('../ai-client');
const { botName } = require('../config.json');

module.exports = {
	name: Events.MessageCreate,
	once: false,
	execute(message) {
        let discussion = "";
        console.log((!message.content.toLowerCase().includes(botName.toLowerCase()) || message.author.bot))
        if (!message.content.toLowerCase().includes(botName.toLowerCase()) || message.author.bot) return;

        message.channel.sendTyping();
        message.channel.messages.fetch({ limit: 10 }).then(messages => {
            messages = messages.reverse();
            messages.forEach(msg => {
                discussion += msg.author.username+":"+msg.content+"\n\n";
            });
        }).then(() => {
            console.log(discussion);
            return getAiSummary(discussion);
        }).then((summary) => {
            console.log(summary.choices[0].message.content);
            return getAiCompletion(message.author.username+': ' + message.content, summary.choices[0].message.content);
        }).then((response) => { 
            console.log(response);
            message.channel.send(response);
        });
	},
};