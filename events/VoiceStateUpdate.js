import { Events } from 'discord.js';

export default {
    name: Events.VoiceStateUpdate,
    once: false,
    execute(object) {
        if (object.member.user.bot) {
            console.log('Bot connected on voice channel ' + object.channel);
        }
    },
};