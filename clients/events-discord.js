export default class EventDiscord {
    eventName = 'eventName';
    once = false;
    handler(){};

    constructor(client){
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
        this.client.on(this.eventName,this.handler);
    }

    initOnceEvent(){
        this.client.once(this.eventName,this.handler);
    }
}