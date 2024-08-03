import { Client } from "discord.js";

interface EventDiscordType {
  eventName: string;
  once: boolean;
  handler: Function;
  client: Client;
  init: () => void;
  initOnEvent: () => void;
  initOnceEvent: () => void;
}

export default abstract class EventDiscord implements EventDiscordType {
  constructor(
    public client: Client,
    public once: boolean = false,
    public eventName: string = "eventName",
    public handler: Function = function () {}
  ) {}

  init() {
    this.once ? this.initOnceEvent() : this.initOnEvent();
    console.log(this.eventName + " added");
  }

  initOnEvent() {
    this.client.on(this.eventName, this.handler.bind(this));
  }

  initOnceEvent() {
    this.client.once(this.eventName, this.handler.bind(this));
  }
}
