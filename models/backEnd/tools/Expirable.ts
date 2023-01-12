export class Expirable{

    private timestamp : Date;
    private readonly timeToLive : number | undefined;

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
        let outcome =  new Date().getTime() < this.expiryTime()
        return outcome
    }

    private expiryTime() : number {
        if(this.timeToLive) {
            return this.timestamp.getTime() + this.timeToLive * 1000
        }
        else
            return Infinity
    }

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