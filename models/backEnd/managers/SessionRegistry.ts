import {Purgeable} from "../tools/SelfPurgingMap";
import {User} from "../User";
import {SessionHasBeenInvalidated} from "../tools/Errors";
import {Expirable} from "../tools/Expirable";
import prisma from "../../../prisma/prisma";
import {UserManager} from "./UserManager";

export class SessionRegistry extends Purgeable {
    private static instance: SessionRegistry | null = null;

    public sessions: Map<String, Session>;
    public accessTokens: Map<String, AccessToken>;

    private constructor() {
        super();
        this.sessions = new Map<String, Session>();
        this.accessTokens = new Map<String, AccessToken>();
    }

    private async DBload() {
        let dbFetch = await prisma.session.findMany(
            {
                include : {
                    accesstoken : true
                }
            }
        )

        let userManagerInstance = await UserManager.getInstance()

        for(let row of dbFetch) {
            let thisSession = new Session(await userManagerInstance.getUserID(row.UserID),row.agent, row.timestamp, row.TTL)

            for(let token of row.accesstoken) {
                let newAccessToken = new AccessToken(thisSession, token.token, token.timestamp, token.TTL)
                this.accessTokens.set(newAccessToken.getToken(),newAccessToken)
                thisSession.insertAccessToken(newAccessToken, token.sequence);
            }
            this.sessions.set(row.refreshToken, thisSession)
        }
    }

    public static async getInstance() {
        if (this.instance === null) {
            this.instance = new SessionRegistry();
            await this.instance.DBload();
        }
        return this.instance;
    }

    public static generateToken(length: number): string {
        let a: string[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
        let b: string[] = [];
        for (let i = 0; i < length; i++) {
            let j: number = Math.floor(Math.random() * (a.length - 1));
            b[i] = a[j];
        }
        return b.join("");
    }

    public async addSession(user: User, agent: string): Promise<string> {
        await super.notify()

        let x = SessionRegistry.generateToken(16)
        let newSession =  new Session(user, agent)
        this.sessions.set(x, newSession)

        const dump = await prisma.session.createMany({
            data : {
                timestamp : newSession.getTimestamp(),
                UserID: user.getID(),
                invalidated: false,
                TTL: newSession.getTTL(),
                refreshToken: x,
                agent: agent
            }
        })

        return x
    }

    public async accessTokenRequest(refreshToken: string, agent: string): Promise<string> {

        let x = this.sessions.get(refreshToken)

        if (x) {
            if (x.checkAgent(agent)) {
                if (x.checkValidity()) {

                    let newToken = await x.getNewAccessToken();
                    let token = newToken.getToken();

                    this.accessTokens.set(token, newToken)
                    return token;
                }
                else {
                    await x.destroy()
                }
            }
            else {
                await x.destroy()
            }
        }
        throw new SessionHasBeenInvalidated();
    }

    public async getSession(accessToken: String, agent: string): Promise<User | null> {
        let x = this.accessTokens.get(accessToken)

        if (x) {
            if (await x.informParent(agent)) {
                let result = x.checkValidity()
                if (!result)
                {
                    if(!x.getSession().checkValidity())
                    {
                        await this.purgeAccessTokens(x.getSession())
                        this.sessions.forEach((row,rf) => {
                            if(row === x!.getSession())
                            {
                                this.sessions.delete(rf)
                            }
                        })

                    }
                    return null
                }
                return x.getSession().getUser()
            }
        }
        return null;
    }

    //overwrite from Purgeable
    protected async purgeAsync() {
        //for all sessions
        for(let key of Array.from(this.sessions.keys()))
        {
            let value = this.sessions.get(key)!
            //if expired
            if (!value.checkValidity()) {
                //delete that session
                await this.purgeAccessTokens(value)

                this.sessions.delete(key)

                //proceed to free-up the space
                await this.purgeAccessTokens(value)
            }
        }
    }

    // public method for removing a session in case of a logout for example
    public async removeSession(refreshToken: String) {
        let session = this.sessions.get(refreshToken)
        if (session) {
            //first invalidate
            await session.destroy()

            //delete the session
            this.sessions.delete(refreshToken)

            //proceed to free-up the space
            await this.purgeAccessTokens(session)
        } else {
            throw new SessionHasBeenInvalidated
        }
    }

    //method for freeing up the space after sessions die
    private async purgeAccessTokens(session: Session) {
        //get all related access tokens
        let accessTokenToBePurged = session.getAllAccessTokens();
        let nextArg = accessTokenToBePurged.next()

        //delete all of them
        while (!nextArg.done) {
            await nextArg.value.asyncOnDeath()

            this.accessTokens.delete(nextArg.value.getToken())
            nextArg = accessTokenToBePurged.next()
        }

        await session.destroy()
    }
}

class Session extends Expirable {

    private readonly user: User;
    private invalidated: boolean;
    private accessTokens: Map<AccessToken, number>;
    private readonly userAgent: string;

    public constructor(user: User, agent: string, timestamp? : Date, TTL? : number) {
        if(TTL)
        {
            super(TTL, timestamp)
        }
        else{
            super(36000) // 10 hours
        }
        this.user = user;
        this.accessTokens = new Map<AccessToken, number>();
        this.invalidated = false;
        this.userAgent = agent;
    }

    public async checkAccess(accessKey: AccessToken, agent: string): Promise<boolean> {

        if (!(this.accessTokens.get(accessKey) === this.accessTokens.size - 1 && this.checkAgent(agent))) {
            await this.destroy();
            return false;
        }
        return !this.invalidated;
    }

    public getUser(): User {
        if (this.user) {
            return this.user;
        }
        throw new SessionHasBeenInvalidated();
    }

    public async destroy() {
        this.invalidated = true;
        console.log("destroyed",this.user.getID())
        await prisma.session.delete(
            {
                where : {
                    UserID_timestamp: { UserID: this.user.getID(), timestamp: this.getTimestamp()}
                }
            }
        )
    }

    public async getNewAccessToken(): Promise<AccessToken> {
        let x = new AccessToken(this, SessionRegistry.generateToken(16))

        console.log("requestedNew",this.user.getID())

        if(this.user?.getID() && !this.invalidated && this.checkValidity()) {
            let dump = await prisma.accesstoken.create({
                data: {
                    sequence: this.accessTokens.size,
                    token: x.getToken(),
                    Sessiontimestamp: this.getTimestamp(),
                    SessionUserID: this.user.getID(),
                    timestamp: x.getTimestamp(),
                    TTL: x.getTTL()
                }
            })
        }

        this.accessTokens.set(x, this.accessTokens.size)
        return x;
    }

    public async asyncOnDeath() {
        if(this.user?.getID()) {
            await prisma.session.delete({
                    where: {
                        UserID_timestamp: { UserID: this.user.getID(), timestamp: this.getTimestamp()}
                    }
                }
            )
        }

    }

    public checkAgent(agent: string): boolean {
        return this.userAgent === agent;
    }

    //only to be used for purging them
    public getAllAccessTokens(): IterableIterator<AccessToken> {
        return this.accessTokens.keys()
    }

    public insertAccessToken(at : AccessToken, seq : number) {
        this.accessTokens.set(at, seq)
    }

}

class AccessToken extends Expirable {
    private readonly session: Session;
    private readonly token: string;

    public constructor(session: Session, token: string, timestamp? : Date, TTL? : number) {
        if(TTL)
        {
            super(TTL, timestamp)
        }
        else{
            super(300)
        }
        this.session = session;
        this.token = token;
    }

    public async informParent(agent: string): Promise<boolean> {
        return this.session.checkAccess(this, agent)
    }

    public getSession(): Session {
        return this.session;
    }

    public getToken(): string {
        return this.token;
    }

    public async asyncOnDeath(): Promise<void> {
        await prisma.accesstoken.delete(
            {
                where : {
                    token: this.token
                }
            }
        )
    }
}