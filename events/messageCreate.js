const { Events } = require('discord.js');
const { getAiCompletion, getAiSummary } = require('../ai-client');
const { botName, maxHistory } = require('../config.json');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

module.exports = {
	name: Events.MessageCreate,
	once: false,
	execute(message) {

        let discussion = "";
        let finalResponse = "";
        let hasImage = false;
        let imagePath = "";

        if (!message.content.toLowerCase().includes(botName.toLowerCase()) || message.author.bot) return;

        message.channel.sendTyping();
        message.channel.messages.fetch({ limit: maxHistory }).then(messages => {
            messages = messages.reverse();
            console.log("history : " + messages);
            messages.forEach(msg => {
                discussion += msg.author.username+":"+msg.content+"\n\n";
            });

        }).then(() => {

            console.log('Getting summary...');

            return getAiSummary(discussion);
        }).then((summary) => {
            console.log(summary.choices[0].message.content);
            console.log('Getting completion...');
            message.channel.sendTyping();

            return getAiCompletion(message, summary.choices[0].message.content);

        }).then((completion) => {

            const urlRegex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
            const imageUrl = completion.match(urlRegex)?.find(url => url.includes('oaidalleapiprodscus'));
            finalResponse = completion;

            if(imageUrl) {
                console.log('Image detected...');
                hasImage = true;
                finalResponse = finalResponse.replace(imageUrl, '');
                finalResponse = finalResponse.replace(/!\[.*\]\(\)/, '');

                message.channel.sendTyping();

                return axios.get(imageUrl, { responseType: 'arraybuffer' })
            }
            return;

        }).then(response => {
            
            if(!hasImage) {
                return;
            }

            console.log('Getting image...');
            const timestamp = new Date().getTime();
            const imageName = timestamp+'.jpg';
            const imageData = Buffer.from(response.data, 'binary');
            imagePath = path.join(__dirname, './../tmp', imageName);
            console.log('Saving image to ' + imagePath);

            return fs.writeFileSync(imagePath, imageData);

        }).then(() => {

            console.log('Image saved locally:', imagePath);
            message.channel.send(finalResponse);
            console.log('Message sent');

        }).finally(async () => {

            if(hasImage) {
                await message.channel.send({ files: [imagePath] });
                console.log('Image sent');
                if (fs.existsSync(imagePath)) {
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Image deleted:', imagePath);
                        }
                    });
                }

            }
            console.log('Done');
        });
	},
};