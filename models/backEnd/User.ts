import bcrypt from 'bcrypt';
import {Expirable} from "./tools/Expirable";
import {MaxPasswordLengthExceeded} from "./tools/Errors";
import {UserManager} from "./managers/UserManager";
import prisma from "../../prisma/prisma";

export type UserDetails = {
    nickname: string,
    email: string,
    fname: string,
    lname: string
}

export class User extends Expirable {
    private id: number;
    private nickname: string;
    private email: string;
    private fname: string;
    private lname: string;
    private passHash: string;

    /**
     * Bcrypt only allows to check strings up to 72 bytes so these methods
     * is useful to check if the provided password doesn't exceed that limit.
     */

    /**
     * Method doing the final evaluation of the password.
     * It must adhere to all the constraints specified in the front-end.
     */

    private static evaluatePassword(password: string): boolean {
        if (password.length <= 18) {
            return true
        } else {
            throw new MaxPasswordLengthExceeded(password.length);
        }
    }

    /**
     * Method generating the hash of the password. Uses bcrypt.
     */

    public static async generateHash(password: string): Promise<string> {
        User.evaluatePassword(password)
        let saltRounds = 10;
        return await bcrypt.hash(password, saltRounds)
    }


    /**
     *
     * @param nickname      - user's nickname (must be unique)
     * @param email         - user's email (must be unique)
     * @param fname         - user's fname
     * @param lname         - user's lname
     * @param password      - password MUST BE ALREADY ENCRYPTED
     */
    public constructor(id : number, nickname: string, email: string, fname: string, lname: string, password: string) {
        super(600) // 10 minutes
        this.id = id;
        this.passHash = password;
        this.nickname = nickname;
        this.email = email;
        this.fname = fname;
        this.lname = lname;
    }

    private async comparePasswordAttempt(attempt: string): Promise<boolean> {
        if (this.passHash.length > 0) {
            return await bcrypt.compare(attempt, this.passHash)
        }
        return false
    }

    public async checkCredentials(login: string, password: string): Promise<boolean> {
        if (login == this.email || login == this.nickname) {
            if (this.passHash) {
                return await this.comparePasswordAttempt(password);
            }
        }
        return false;
    }

    public getAllDetails(): UserDetails {
        super.refresh()
        return {
            nickname: this.nickname,
            email: this.email,
            fname: this.fname,
            lname: this.lname
        }
    }

    public getFName(): string {
        super.refresh()

        return this.fname
    }

    public getLName(): string {
        super.refresh()

        return this.lname
    }

    public getEmail(): string {
        super.refresh()

        return this.email
    }

    public getNickname(): string {
        super.refresh()

        return this.nickname
    }

    public getPassHash(): string {
        super.refresh()

        return this.passHash
    }

    public setNickname(nickname: string) {
        super.refresh()

        UserManager.getInstance().updateNick(this.nickname, nickname)
        this.nickname = nickname;
    }

    public setEmail(email: string) {
        super.refresh()

        UserManager.getInstance().updateEmail(this.email, email)
        this.email = email;
    }

    public setFname(fname: string) {
        super.refresh()

        this.fname = fname;
        prisma.user.update({
            where : {
                ID : this.id
            },
            data : {
                fname : fname
            }
        })
    }

    public setLname(lname: string) {
        super.refresh()

        this.lname = lname;
        prisma.user.update({
            where : {
                ID : this.id
            },
            data : {
                lname : lname
            }
        })
    }

    public setPassword(password: string) {
        super.refresh()

        User.evaluatePassword(password) //evaluate and if there are no errors continue

        this.passHash = "";

        User.generateHash(password).then( async (hash: string) => {
            this.passHash = hash;
            console.log(this.passHash, this.id)
            await prisma.user.update({
                where : {
                    ID: this.id
                },
                data : {
                    passHash : this.passHash
                }
            })
        });
    }

    public updateManager() {
        UserManager.getInstance().updateUserNonIdentifier(this.email, this.fname, this.lname, this.passHash)
    }

    public getID() {
        return this.id;
    }
}