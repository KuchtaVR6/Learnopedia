export class Expirable{

    private timestamp : Date;
    private readonly timeToLive : number | undefined;

    public constructor(TTL? : number) //ttl in seconds
    {
        this.timestamp = new Date();
        if(TTL) {
            this.timeToLive = TTL;
        }
    }

    public checkValidity() : boolean {
        return new Date().getTime() < this.expiryTime()
    }

    private expiryTime() : number {
        if(this.timeToLive)
            return this.timestamp.getTime() + this.timeToLive*1000
        else
            return Infinity
    }

    public refresh(){
        this.timestamp = new Date();
    }

    public onDeath(){
    }

    public onNudge(){
    }
}