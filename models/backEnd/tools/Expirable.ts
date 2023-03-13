export class Expirable{

    private timestamp : Date;
    private readonly timeToLive : number | undefined;

    /**
        @param TTL (OPTIONAL) - denotes the time to live in seconds (how much time needs to elapse before this instance expires)
                                if not set the instance will never expire
        @param timestamp (OPTIONAL) - denotes the time since the TTL ought to be counted from
                                      if not set will start counting from the current time

        examples:
            TTL = 20 sec; timestamp = not set; - will expire 20 seconds after creation
            TTL = not set; timestamp = value does not matter; - will never expire
            TTL = 40 sec; timestamp = date that was exactly 10 seconds ago; - will expire in 30 seconds after creation
            TTL = 15 sec; timestamp = date that was exactly 50 seconds ago; - will be expired at creation
     */

    public constructor(TTL? : number, timestamp? : Date) //ttl in seconds
    {
        if(timestamp){
            this.timestamp = timestamp;
        }
        else{
            this.timestamp = new Date();
        }

        if(TTL) {
            this.timeToLive = TTL;
        }
    }

    public checkValidity() : boolean {
        return new Date().getTime() < this.expiryTime()
    }

    private expiryTime() : number {
        if(this.timeToLive) {
            return this.timestamp.getTime() + this.timeToLive * 1000
        }
        else
            return Infinity
    }

    /**
     *  If extra time is to be granted to this instance refresh() can be used to "restart the timer" from the current time
     */

    public refresh(){
        this.timestamp = new Date();
    }

    public onDeath(){
    }

    public async asyncOnDeath(){
    }

    public async asyncOnNudge(){
    }

    public onNudge(){
    }

    public getTimestamp() : Date {
        return this.timestamp
    }

    public getTTL() : number {
        if(this.timeToLive)
            return this.timeToLive
        return -1
    }
}