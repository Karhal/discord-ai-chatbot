import { Client } from 'discord.js';

export default class EventDiscord {
    eventName:string = 'eventName';
    once: Boolean = false;
    handler:Function = function(){};
    client : Client

    constructor(client:Client){
        this.client = client;
    }

    init(){
        if(!this.once){
            this.initOnEvent();
        }
        else {
            this.initOnceEvent();
        }
        console.log(this.eventName + ' added');
    }

    initOnEvent(){
        this.client.on(this.eventName,this.handler.bind(this));
    }

    initOnceEvent(){
        this.client.once(this.eventName,this.handler.bind(this));
    }
}