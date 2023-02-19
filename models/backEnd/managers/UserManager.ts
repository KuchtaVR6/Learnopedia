import {User} from "../User";
import {CredentialsNotUnique, InvalidArgument, UserNotFoundException} from "../tools/Errors";
import SelfPurgingMap from "../tools/SelfPurgingMap";
import prisma from "../../../prisma/prisma";
import Amendment, {AmendmentOpinionValues} from "../amendments/Amendment";
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
        return new User(-1,"DELETED USER", "deleted@deleted", "DELETED", "DELETED", "===", [], new Map<number, boolean>(), new Map<number, number>(), null, null, null,false , new Map<number, Date | true>())
    }

    public async addUser(nickname: string, email: string, fname: string, lname: string, password: string): Promise<User> {
        let ansNick = await this.validateEmailRes(email)
        let ansEmail = await this.validateNicknameRes(nickname)
        if (ansNick && ansEmail) {
            return this.userStore.push(nickname, email, fname, lname, password)
        }
        throw new CredentialsNotUnique();
    }

    public deleteUser(user: User): Promise<boolean> {
        return this.userStore.delete(user)
    }

    public async validateEmail(email: string) {
        return !(await this.userStore.emailTaken(email))
    }

    //difference is that it allows reserved emails
    public async validateEmailRes(email: string) {
        return !(await this.userStore.emailTaken(email, true))
    }

    public async validateNickname(nickname: string) {
        return !(await this.userStore.nicknameTaken(nickname))
    }

    //difference is that it allows reserved emails
    public async validateNicknameRes(nickname: string) {
        return !(await this.userStore.nicknameTaken(nickname, true))
    }

    public async updateUserNonIdentifier(email: string, fname: string, lname: string, passHash: string, avatarPath : string | null) {
        await this.userStore.updateDB(email, fname, lname, passHash, avatarPath);
    }

    public async updateEmail(oldIdentifier: string, newIdentifier: string) {
        if(await this.validateEmail(newIdentifier)) {
            await this.userStore.updateEmail(oldIdentifier, newIdentifier)
        }
        else {
            throw new InvalidArgument("email","must not be taken")
        }
    }

    public async updateNick(oldIdentifier: string, newIdentifier: string) {
        if(await this.validateNickname(newIdentifier)) {
            await this.userStore.updateNick(oldIdentifier, newIdentifier)
        }
        else {
            throw new InvalidArgument("nickname","must not be taken")
        }
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
        } else if (!/[a-z]/i.test(password)) {
            return false;
        } else if (password.toLowerCase() === password || password.toUpperCase() === password) {
            return false;
        } else if (!/[0-9]/.test(password)) {
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

    private readonly DBread : Promise<boolean> | null;

    public constructor() {
        this.mainMap = new SelfPurgingMap<String, User>();
        this.takenMap = new Map<String, boolean>();
        this.idMap = new SelfPurgingMap<number, User>();

        this.takenMap.set("deleted user", true)
        this.takenMap.set("deleted@deleted", true)

        this.DBread = this.getDBUnique()
    }

    private async getDBUnique() : Promise<boolean> {
        let rows = await prisma.user.findMany({
            select: {
                email: true,
                nickname: true
            }
        })

        rows.forEach((value: { email: string, nickname: string }) => {
            this.takenMap.set(value.email.toLowerCase(), true)
            this.takenMap.set(value.nickname.toLowerCase(), true)
        })
        return true
    }

    private cache(newUser: User): User {

        this.mainMap.set(newUser.getEmail().toLowerCase(), newUser)
        this.mainMap.set(newUser.getNickname().toLowerCase(), newUser)
        this.takenMap.set(newUser.getEmail().toLowerCase(), true)
        this.takenMap.set(newUser.getNickname().toLowerCase(), true)

        return newUser;
    }

    public reserve(email: string, nickname: string) {
        this.takenMap.set(email.toLowerCase(), false);
        this.takenMap.set(nickname.toLowerCase(), false)
    }

    public release(email: string, nickname: string) {
        if (this.takenMap.get(email.toLowerCase()) === false) {
            this.takenMap.delete(email.toLowerCase())
        }
        if (this.takenMap.get(nickname.toLowerCase()) === false) {
            this.takenMap.delete(nickname.toLowerCase())
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
                passHash: passHash,
                moderator: false
            }
        })

        return this.cache(new User(output.ID, nickname, email, fname, lname, passHash, [], new Map<number, boolean>(), new Map<number, number>(), null, null, null, false, new Map<number, true | Date>()));
    }

    private async dbScanFinished() {
        if(this.DBread)
        {
            await this.DBread
        }
    }

    public async delete(user: User): Promise<boolean> {
        await this.dbScanFinished()

        this.mainMap.delete(user.getNickname().toLowerCase())
        this.mainMap.delete(user.getEmail().toLowerCase())
        this.takenMap.delete(user.getEmail().toLowerCase())
        this.takenMap.delete(user.getNickname().toLowerCase())

        await prisma.user.delete({
            where: {
                email: user.getEmail().toLowerCase()
            }
        })

        return true
    }

    public async retrieve(query: string): Promise<User> {
        await this.dbScanFinished()

        //check the cache
        let result = this.mainMap.get(query.toLowerCase())
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
                },
                contentopinion : true,
                amendmentopinion: true,
                bookmarks: true
            }
        })

        if (dbUser) {
            let amendArray : Amendment[] = await AmendmentManager.getInstance().insertManyToCache(dbUser.amendment);

            let opMap : Map<number, boolean> = new Map<number, boolean>();
            dbUser.contentopinion.map((row) => {
                opMap.set(row.contentID, row.positive)
            })

            let AmendOpMap : Map<number, number> = new Map<number, number>();
            dbUser.amendmentopinion.map((row) => {
                let val : AmendmentOpinionValues;
                if(row.positive)
                {
                    val = AmendmentOpinionValues.Positive
                } else if (row.negative)
                {
                    val = AmendmentOpinionValues.Negative
                } else {
                    val = AmendmentOpinionValues.Report
                }

                AmendOpMap.set(row.amendmentID, val)
            })

            let bookmarksMap : Map<number, true | Date> = new Map<number, true | Date>();
            dbUser.bookmarks.map((row) => {
                bookmarksMap.set(row.contentID, row.reminderTimestamp && row.reminderTimestamp > new Date()? row.reminderTimestamp : true)
            })

            return this.cache(
                new User(
                    dbUser.ID,
                    dbUser.nickname,
                    dbUser.email,
                    dbUser.fname,
                    dbUser.lname,
                    dbUser.passHash,
                    amendArray,
                    opMap,
                    AmendOpMap,
                    dbUser.avatarFile,
                    dbUser.uploadCacheFile,
                    dbUser.suspension,
                    dbUser.moderator, bookmarksMap, dbUser.colorA, dbUser.colorB))
        }

        throw new UserNotFoundException(query)
    }

    public async retrieveID(id: number): Promise<User> {
        await this.dbScanFinished()

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
                },
                contentopinion: true,
                amendmentopinion: true,
                bookmarks : true,
            }
        })

        if(dbUser)
        {
            let amendArray : Amendment[] = await AmendmentManager.getInstance().insertManyToCache(dbUser.amendment);

            let opMap : Map<number, boolean> = new Map<number, boolean>();
            dbUser.contentopinion.map((row) => {
                opMap.set(row.contentID, row.positive)
            })

            let AmendOpMap : Map<number, number> = new Map<number, number>();
            dbUser.amendmentopinion.map((row) => {
                let val : AmendmentOpinionValues;
                if(row.positive)
                {
                    val = AmendmentOpinionValues.Positive
                } else if (row.negative)
                {
                    val = AmendmentOpinionValues.Negative
                } else {
                    val = AmendmentOpinionValues.Report
                }

                AmendOpMap.set(row.amendmentID, val)
            })

            let bookmarksMap : Map<number, true | Date> = new Map<number, true | Date>();
            dbUser.bookmarks.map((row) => {
                bookmarksMap.set(row.contentID, row.reminderTimestamp && row.reminderTimestamp > new Date()? row.reminderTimestamp : true)
            })

            let newUser = new User(
                dbUser.ID,
                dbUser.nickname,
                dbUser.email,
                dbUser.fname,
                dbUser.lname,
                dbUser.passHash,
                amendArray,
                opMap,
                AmendOpMap,
                dbUser.avatarFile,
                dbUser.uploadCacheFile,
                dbUser.suspension,
                dbUser.moderator, bookmarksMap, dbUser.colorA, dbUser.colorB);
            this.idMap.set(id, newUser)
            return newUser;
        }
        throw new UserNotFoundException(`${id}`)
    }

    // will return true if the email is invalid
    public async emailTaken(email: string, allowReserved?: boolean): Promise<boolean> {
        await this.dbScanFinished()

        if (email.indexOf("@") >= 0 && email.indexOf("@") <= email.length - 2) {
            if (email.length > 3) {
                if (allowReserved) {
                    let result = this.takenMap.get(email.toLowerCase())
                    return result === true;
                }
                return this.takenMap.has(email.toLowerCase())
            }
        }
        return true
    }

    // will return true if the nickname is invalid
    public async nicknameTaken(nickname: string, allowReserved?: boolean): Promise<boolean> {
        await this.dbScanFinished()

        if (nickname.indexOf("@") < 0) {
            if (nickname.length > 3) {
                if (allowReserved) {
                    let result = this.takenMap.get(nickname.toLowerCase())
                    return result === true;
                }
                return this.takenMap.has(nickname.toLowerCase())
            }
        }
        return true
    }

    public async updateDB(email: string, fname: string, lname: string, passHash: string, avatarPath: string | null) {

        await prisma.user.update({
            where: {
                email: email
            },
            data: {
                lname: lname,
                fname: fname,
                passHash: passHash,
                avatarFile : avatarPath
            },
        })
    }

    private updateIdentifierCaches(oldIdentifier: string, newIdentifier: string) {
        let user = this.mainMap.get(oldIdentifier.toLowerCase())

        if (user) {
            this.mainMap.delete(oldIdentifier.toLowerCase())
            this.mainMap.set(newIdentifier.toLowerCase(), user)
            this.takenMap.delete(oldIdentifier.toLowerCase())
            this.takenMap.set(newIdentifier.toLowerCase(), true)
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