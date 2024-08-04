import EventDiscord from '../clients/events-discord.js';
import { Events } from 'discord.js';
import { ConsoleLogger } from '../console-logger.js';

export default class VoiceStateUpdate extends EventDiscord {
  eventName = Events.VoiceStateUpdate;
  handler = function execute(object: any) {
    if (object.member.user.bot) {
      ConsoleLogger.log(
        'INFOS',
        'Bot connected on voice channel ' + object.channel
      );
    }
  };
}
