import {Expirable} from "./Expirable";

/**
 * A class for implementing some of SelfPurgingMap functionality manually
 */
export class Purgeable{
    private timestamp: Date;

    private readonly purgeInterval: number = 600; //10 minutes

    /**
     * @param purgeInterval (OPTIONAL) -    specify minimum time between purges in seconds
     *                                      if not set defaults to 10 minutes
     */
    public constructor(purgeInterval? : number) {
        this.timestamp = new Date();
        if(purgeInterval)
        {
            this.purgeInterval = purgeInterval
        }
    }

    /**
     * Method to be overwritten with the purging methods
     */
    protected purge(){}

    /**
     * calculate if this is a time for a purge
     */
    private checkPurge() : boolean {
        return new Date().getTime() > this.expiryTime()
    }

    /**
     * calculate the EPOCH second of expiry
     */
    private expiryTime() : number {
        if(this.purgeInterval)
            return this.timestamp.getTime() + this.purgeInterval*1000
        else
            return Infinity
    }

    /**
     * method for reporting actions taken. It will check if
     * a purge is due and perform it in that case.
     */
    protected notify()
    {
        if(this.checkPurge())
        {
            this.timestamp = new Date();
            this.purge();
        }
    }
}

/**
 * A special type of map that will purge all expired entries once in a while.
 */
export default class SelfPurgingMap<key, value extends Expirable> extends Map<key, value> {
    private timestamp: Date;

    private readonly purgeInterval: number = 600; //10 minutes

    /**
     * @param purgeInterval (OPTIONAL) -    specify minimum time between purges in seconds
     *                                      if not set defaults to 10 minutes
     */
    public constructor(purgeInterval? : number) {
        super();
        this.timestamp = new Date();
        if(purgeInterval)
        {
            this.purgeInterval = purgeInterval
        }
    }

    /**
     * check all the entries and delete expired ones
     * and reset the timestamp (for the next purge)
     */
    private purge(){
        this.timestamp = new Date();

        super.forEach((value: value, key : key) => {
            value.onNudge()
            if(!value.checkValidity())
            {
                value.onDeath()
                super.delete(key)
            }
        })
    }

    /**
     * calculate if this is a time for a purge
     */
    private checkPurge() : boolean {
        return new Date().getTime() > this.expiryTime()
    }

    /**
     * calculate the EPOCH second of expiry
     */
    private expiryTime() : number {
        if(this.purgeInterval)
            return this.timestamp.getTime() + this.purgeInterval*1000
        else
            return Infinity
    }

    /**
     * method for reporting actions taken. It will check if
     * a purge is due and perform it in that case.
     */
    private notify()
    {
        if(this.checkPurge())
        {
            this.purge();
        }
    }

    /**
     * A basic overwrite of the set function,
     * which notifies the class seeking potential
     * purges.
     *
     */
    public set(key: key, value : value) {
        this.notify()
        return super.set(key,value)
    }

    /**
     * Rest of the map methods get inherited, without notify.
     */
}


