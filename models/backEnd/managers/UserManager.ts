import {User} from "../User";
import {CredentialsNotUnique, UserNotFoundException} from "../tools/Errors";
import SelfPurgingMap from "../tools/SelfPurgingMap";
import prisma from "../../../prisma/prisma";
import Amendment from "../amendments/Amendment";
import AmendmentManager, {prismaInclusions} from "../amendments/AmendmentManager";

export class UserManager {
    private static instance: UserManager | undefined;
    private userStore: UserStore;

    private constructor() {
        this.userStore = new UserStore()
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }

    public async getUser(query: string): Promise<User> {
        return await this.userStore.retrieve(query)
    }

    public async getUserID(id : number) : Promise<User> {
        return await this.userStore.retrieveID(id)
    }

    public deletedUser() {
        return new User(-1,"DELETED USER", "deleted@deleted", "DELETED", "DELETED", "===", [])
    }

    public async addUser(nickname: string, email: string, fname: string, lname: string, password: string): Promise<User> {
        if (this.validateEmailRes(email) && this.validateNicknameRes(nickname)) {
            return this.userStore.push(nickname, email, fname, lname, password)
        }
        throw new CredentialsNotUnique();
    }

    public deleteUser(user: User): Promise<boolean> {
        return this.userStore.delete(user)
    }

    public validateEmail(email: string) {
        return !this.userStore.emailTaken(email)
    }

    //difference is that it allows reserved emails
    public validateEmailRes(email: string) {
        return !this.userStore.emailTaken(email, true)
    }

    public validateNickname(nickname: string) {
        return !this.userStore.nicknameTaken(nickname)
    }

    //difference is that it allows reserved emails
    public validateNicknameRes(email: string) {
        return !this.userStore.nicknameTaken(email, true)
    }

    public async updateUserNonIdentifier(email: string, fname: string, lname: string, passHash: string) {
        await this.userStore.updateDB(email, fname, lname, passHash);
    }

    public async updateEmail(oldIdentifier: string, newIdentifier: string) {
        await this.userStore.updateEmail(oldIdentifier, newIdentifier)
    }

    public async updateNick(oldIdentifier: string, newIdentifier: string) {
        await this.userStore.updateNick(oldIdentifier, newIdentifier)
    }

    public reserve(email: string, nickname: string) {
        this.userStore.reserve(email, nickname);
    }

    public release(email: string, nickname: string) {
        this.userStore.release(email, nickname)
    }

    public validatePassword(password: string) {
        if (password.length < 8) {
            return false;
        } else if (password.length > 18) {
            return false;
        } else if (password.toLowerCase() === password || password.toUpperCase() === password) {
            return false;
        } else if (!/[0-9]/.test(password)) {
            return false;
        } else if (!/[a-z]/i.test(password)) {
            return false;
        }
        return true;
    }
}

class UserStore {
    /**
     * this map stores 2 rows for each User
     * one with nickname to User mapping and
     * one with email to User mapping
     */
    private readonly mainMap: SelfPurgingMap<String, User>;
    private readonly takenMap: Map<String, boolean>;

    private readonly idMap : SelfPurgingMap<number, User>;

    public constructor() {
        this.mainMap = new SelfPurgingMap<String, User>();
        this.takenMap = new Map<String, boolean>();
        this.idMap = new SelfPurgingMap<number, User>();

        this.takenMap.set("DELETED USER", true)
        this.takenMap.set("deleted@deleted", true)

        this.getDBUnique()
    }

    private async getDBUnique() {
        let rows = await prisma.user.findMany({
            select: {
                email: true,
                nickname: true
            }
        })

        rows.forEach((value: { email: string, nickname: string }) => {
            this.takenMap.set(value.email, true)
            this.takenMap.set(value.nickname, true)
        })
    }

    private cache(newUser: User): User {
        this.mainMap.set(newUser.getEmail(), newUser)
        this.mainMap.set(newUser.getNickname(), newUser)
        this.takenMap.set(newUser.getEmail(), true)
        this.takenMap.set(newUser.getNickname(), true)
        return newUser;
    }

    public reserve(email: string, nickname: string) {
        this.takenMap.set(email, false);
        this.takenMap.set(nickname, false)
    }

    public release(email: string, nickname: string) {
        this.takenMap.set(email, false);
        if (this.takenMap.get(email) === false) {
            this.takenMap.delete(email)
        }
        if (this.takenMap.get(nickname) === false) {
            this.takenMap.delete(nickname)
        }
    }

    public async push(nickname: string, email: string, fname: string, lname: string, password: string): Promise<User> {
        let passHash = await User.generateHash(password)

        let output = await prisma.user.create({
            data: {
                email: email,
                lname: lname,
                fname: fname,
                nickname: nickname,
                passHash: passHash
            }
        })

        return this.cache(new User(output.ID, nickname, email, fname, lname, passHash, []));
    }

    public async delete(user: User): Promise<boolean> {
        this.mainMap.delete(user.getNickname())
        this.mainMap.delete(user.getEmail())
        this.takenMap.delete(user.getEmail())
        this.takenMap.delete(user.getNickname())

        await prisma.user.delete({
            where: {
                email: user.getEmail()
            }
        })

        return true
    }

    public async retrieve(query: string): Promise<User> {
        //check the cache
        let result = this.mainMap.get(query)
        if (result) {
            return result
        }

        //if that fails
        //fetch from the database
        const dbUser = await prisma.user.findFirst({
            where: {
                OR: [
                    {email: query},
                    {nickname: query}
                ]
            },
            include:{
                amendment : {
                    include : prismaInclusions
                }
            }
        })

        let amendArray : Amendment[] = [];

        if (dbUser) {
            let amendArray : Amendment[] = await AmendmentManager.getInstance().insertManyToCache(dbUser.amendment);
            return this.cache(new User(dbUser.ID, dbUser.nickname, dbUser.email, dbUser.fname, dbUser.lname, dbUser.passHash, amendArray))
        }

        throw new UserNotFoundException(query)
    }

    public async retrieveID(id: number): Promise<User> {
        let result = this.idMap.get(id)
        if (result) {
            return result
        }

        const dbUser = await prisma.user.findFirst({
            where: {
                ID: id
            },
            include : {
                amendment: {
                    include : prismaInclusions
                }
            }
        })

        if(dbUser)
        {
            let amendArray : Amendment[] = await AmendmentManager.getInstance().insertManyToCache(dbUser.amendment);
            let newUser = new User(dbUser.ID,dbUser.nickname, dbUser.email, dbUser.fname, dbUser.lname, dbUser.passHash, amendArray);
            this.idMap.set(id, newUser)
            return newUser;
        }
        throw new UserNotFoundException(`${id}`)
    }

    // will return true if the email is invalid
    public emailTaken(email: string, allowReserved?: boolean): boolean {
        if (email.indexOf("@") >= 0 && email.indexOf("@") <= email.length - 2) {
            if (email.length > 3) {
                if (allowReserved) {
                    let result = this.takenMap.get(email)
                    return result === undefined;
                }
                return this.takenMap.has(email)
            }
        }
        return true
    }

    // will return true if the nickname is invalid
    public nicknameTaken(nickname: string, allowReserved?: boolean): boolean {
        if (nickname.indexOf("@") < 0) {
            if (nickname.length > 3) {
                if (allowReserved) {
                    let result = this.takenMap.get(nickname)
                    return result === undefined;
                }
                return this.takenMap.has(nickname)
            }
        }
        return true
    }

    public async updateDB(email: string, fname: string, lname: string, passHash: string) {

        await prisma.user.update({
            where: {
                email: email
            },
            data: {
                lname: lname,
                fname: fname,
                passHash: passHash
            },
        })
    }

    private updateIdentifierCaches(oldIdentifier: string, newIdentifier: string) {
        let user = this.mainMap.get(oldIdentifier)

        if (user) {
            this.mainMap.delete(oldIdentifier)
            this.mainMap.set(newIdentifier, user)
            this.takenMap.delete(oldIdentifier)
            this.takenMap.set(newIdentifier, true)
        } else {
            throw UserNotFoundException
        }
    }

    public async updateEmail(oldIdentifier: string, newIdentifier: string) {

        this.updateIdentifierCaches(oldIdentifier, newIdentifier);

        await prisma.user.update({
            where: {
                email: oldIdentifier
            },
            data: {
                email: newIdentifier
            },
        })
    }

    public async updateNick(oldIdentifier: string, newIdentifier: string) {

        this.updateIdentifierCaches(oldIdentifier, newIdentifier);

        await prisma.user.update({
            where: {
                nickname: oldIdentifier
            },
            data: {
                nickname: newIdentifier
            },
        })
    }
}