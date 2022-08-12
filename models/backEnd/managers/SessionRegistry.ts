import {Purgeable} from "../tools/SelfPurgingMap";
import {User} from "../User";
import {SessionHasBeenInvalidated} from "../tools/Errors";
import {Expirable} from "../tools/Expirable";

export class SessionRegistry extends Purgeable {
    private static instance: SessionRegistry | null = null;

    public sessions: Map<String, Session>;
    public accessTokens: Map<String, AccessToken>;

    private constructor() {
        super();
        this.sessions = new Map<String, Session>();
        this.accessTokens = new Map<String, AccessToken>();
    }

    public static getInstance() {
        if (this.instance === null) {
            this.instance = new SessionRegistry();
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

    public addSession(user: User, agent: string): string {
        super.notify()

        let x = SessionRegistry.generateToken(16)
        this.sessions.set(x, new Session(user, agent))

        return x
    }

    public accessTokenRequest(refreshToken: String, agent: string): string {
        let x = this.sessions.get(refreshToken)

        if (x) {
            if (x.checkAgent(agent)) {
                if (x.checkValidity()) {
                    let newToken = x.getNewAccessToken();
                    let token = newToken.getToken();

                    this.accessTokens.set(token, newToken)
                    return token;
                }
            }
        }
        throw new SessionHasBeenInvalidated();
    }

    public getSession(accessToken: String, agent: string): User | null {
        let x = this.accessTokens.get(accessToken)

        if (x) {
            if (x.informParent(agent)) {
                let result = x.checkValidity()
                if (!result) {
                    this.sessions.delete(accessToken)
                }
                return x.getSession().getUser()
            }
        }
        return null;
    }

    //overwrite from Purgeable
    protected purge() {
        //for all sessions
        this.sessions.forEach((value, key) => {

            //if expired
            if (!value.checkValidity()) {
                //delete that session
                this.sessions.delete(key)

                //proceed to free-up the space
                this.purgeAccessTokens(value)
            }
        })
    }

    // public method for removing a session in case of a logout for example
    public removeSession(refreshToken: String) {
        let session = this.sessions.get(refreshToken)
        if (session) {
            //first invalidate
            session.destroy()

            //delete the session
            this.sessions.delete(refreshToken)

            //proceed to free-up the space
            this.purgeAccessTokens(session)
        } else {
            throw new SessionHasBeenInvalidated
        }
    }

    //method for freeing up the space after sessions die
    private purgeAccessTokens(session: Session) {
        //get all related access tokens
        let accessTokenToBePurged = session.getAllAccessTokens();
        let nextArg = accessTokenToBePurged.next()

        //delete all of them
        while (!nextArg.done) {
            this.accessTokens.delete(nextArg.value.getToken())
            nextArg = accessTokenToBePurged.next()
        }
    }
}

class Session extends Expirable {

    private user: User | null;
    private invalidated: boolean;
    private accessTokens: Map<AccessToken, number>;
    private readonly userAgent: string;

    public constructor(user: User, agent: string) {
        super(36000) // 10 hours
        this.user = user;
        this.accessTokens = new Map<AccessToken, number>();
        this.invalidated = false;
        this.userAgent = agent;
    }

    public checkAccess(accessKey: AccessToken, agent: string): boolean {
        if (!(this.accessTokens.get(accessKey) === this.accessTokens.size - 1 && this.checkAgent(agent))) {
            this.destroy();
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

    public destroy() {
        this.invalidated = true;
        this.user = null;
    }

    public getNewAccessToken(): AccessToken {
        let x = new AccessToken(this, SessionRegistry.generateToken(16))
        this.accessTokens.set(x, this.accessTokens.size)
        return x;
    }

    public checkAgent(agent: string): boolean {
        return this.userAgent === agent;
    }

    //only to be used for purging them
    public getAllAccessTokens(): IterableIterator<AccessToken> {
        return this.accessTokens.keys()
    }

}

class AccessToken extends Expirable {
    private readonly session: Session;
    private readonly token: string;

    public constructor(session: Session, token: string) {
        super(600) // 10 minutes
        this.session = session;
        this.token = token;
    }

    public informParent(agent: string): boolean {
        return this.session.checkAccess(this, agent)
    }

    public getSession(): Session {
        return this.session;
    }

    public getToken(): string {
        return this.token;
    }

}