import { Client } from 'discord.js';
import AIClient from './ai-client';

interface EventDiscordType {
  eventName: string;
  aiClient: AIClient,
  once: boolean;
  handler: Function;
  discordClient: Client;
  init: () => void;
  initOnEvent: () => void;
  initOnceEvent: () => void;
}

export default abstract class EventDiscord implements EventDiscordType {
  constructor(
    public discordClient: Client,
    public aiClient: AIClient,
    public once: boolean = false,
    public eventName: string = "eventName",
    public handler: Function = function () {}
  ) {}

  init() {
    this.once ? this.initOnceEvent() : this.initOnEvent();
    console.log(this.eventName + " added");
  }

  initOnEvent() {
    this.discordClient.on(this.eventName, this.handler.bind(this));
  }

  initOnceEvent() {
    this.discordClient.once(this.eventName, this.handler.bind(this));
  }
}
