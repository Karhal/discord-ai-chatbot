import EventDiscord from '../clients/events-discord.js';
import { Events, VoiceState } from 'discord.js';

export default class VoiceStateUpdate extends EventDiscord {
  eventName = Events.VoiceStateUpdate;
  handler = (object: VoiceState) => {
    if (object?.member?.user.bot) {
      console.log('Bot connected on voice channel ' + object.channel);
    }
  };
}
