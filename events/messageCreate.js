const { Events } = require('discord.js');
const { getAiCompletion, getAiSummary } = require('../ai-client');

module.exports = {
	name: Events.MessageCreate,
	once: false,
	execute(message) {
        let discussion = "";

        //add condition: if the last message is myself then dont respond
        if (message.author.bot) return;
        
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