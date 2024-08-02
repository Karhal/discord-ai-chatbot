import { Client } from "discord.js";

export default class EventDiscord {
  eventName: string;
  once: boolean;
  handler: Function = function(){};
  client: Client;

  constructor(client: Client) {
    this.client = client;
    this.eventName = "eventName";
    this.once = false;
  }

  init() {
    if (!this.once) {
      this.initOnEvent();
    } else {
      this.initOnceEvent();
    }
    console.log(this.eventName + " added");
  }

  initOnEvent() {
    this.client.on(this.eventName, this.handler.bind(this));
  }

  initOnceEvent() {
    this.client.once(this.eventName, this.handler.bind(this));
  }
}
