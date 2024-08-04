import { Client } from 'discord.js';
import AIClient from './ai-client';
import { ConsoleLogger } from '../console-logger';

export default class EventDiscord {
  eventName: string;
  once: boolean;
  handler: Function = function() {};
  discordClient: Client;
  aiClient: AIClient;

  constructor(discordClient: Client, aiClient: AIClient) {
    this.discordClient = discordClient;
    this.aiClient = aiClient;
    this.eventName = 'eventName';
    this.once = false;
  }

  init() {
    if (!this.once) {
      this.initOnEvent();
    }
    else {
      this.initOnceEvent();
    }
    ConsoleLogger.log('INFOS', this.eventName + ' added');
  }

  initOnEvent() {
    this.discordClient.on(this.eventName, this.handler.bind(this));
  }

  initOnceEvent() {
    this.discordClient.once(this.eventName, this.handler.bind(this));
  }
}
