import bcrypt from 'bcrypt';
import {Expirable} from "./tools/Expirable";
import {InvalidArgument, MaxPasswordLengthExceeded} from "./tools/Errors";
import {UserManager} from "./managers/UserManager";
import prisma from "../../prisma/prisma";
import Amendment, {AmendmentOpinionValues, AmendmentOutput, VotingSupport} from "./amendments/Amendment";
import ContentManager from "./contents/ContentManager";
import AmendmentManager from "./amendments/AmendmentManager";
import Content, {MetaOutput} from "./contents/Content";

export type UserDetails = {
    nickname: string,
    email: string,
    fname: string,
    lname: string,
    XP: number,
    avatarPath: string,
    colorA: string,
    colorB: string
}

export class User extends Expirable {
    private readonly id: number;
    private nickname: string;
    private email: string;
    private fname: string;
    private lname: string;
    private passHash: string;

    private readonly amendments: Amendment[];

    private colorA: string;
    private colorB: string;

    private avatarPath: string | null;
    private uploadCachePath: string | null;

    private readonly isModerator: boolean;

    private suspension: Date | null;

    /**
     content number to upVote (true) / downVote (false)
     */
    private opinions: Map<number, boolean>;

    /**
     content number to vote
     */
    private votes: Map<number, AmendmentOpinionValues>;

    /**
     content number to true / date of the coming reminder (if set)
     */
    private bookmarks: Map<number, Date | true>

    /**
     * Bcrypt only allows to check strings up to 72 bytes so these methods
     * is useful to check if the provided password doesn't exceed that limit.
     */

    /**
     * Method doing the final evaluation of the password.
     * It must adhere to all the constraints specified in the front-end.
     */

    private static evaluatePassword(password: string): boolean {
        if (password.length < 8) {
            throw new InvalidArgument("password", "must be at least 8 chars long")
        } else if (password.length > 18) {
            throw new MaxPasswordLengthExceeded(password.length);
        } else if (!/[a-z]/i.test(password)) {
            throw new InvalidArgument("password", "must contain letters")
        } else if (password.toLowerCase() === password || password.toUpperCase() === password) {
            throw new InvalidArgument("password", "must contain a mix of letter cases")
        } else if (!/[0-9]/.test(password)) {
            throw new InvalidArgument("password", "must contain numbers")
        } else {
            return true
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
     * @param id            - user's id in the db (must be unique)
     * @param nickname      - user's nickname (must be unique)
     * @param email         - user's email (must be unique)
     * @param fname         - user's fname
     * @param lname         - user's lname
     * @param password      - password MUST BE ALREADY ENCRYPTED
     * @param amendments    - amendments associated with the user
     * @param opinions      - map of associated opinions (upvote, downVote)
     * @param votes         - map of associated votes
     * @param avatarPath    - the path to the avatar
     * @param uploadPath    - the path of the last uploaded image
     * @param suspension    - the time until which the user is/has been suspended.
     * @param moderator     - flag distinguishing moderators true = moderator
     * @param bookmarks     - map of bookmark that the user created (including reminders)
     * @param colorA        - color on the left side of the banner on the profile page
     * @param colorB        - color on the right side of the banner on the profile page
     */
    public constructor
    (id: number,
     nickname: string,
     email: string,
     fname: string,
     lname: string,
     password: string,
     amendments: Amendment[],
     opinions: Map<number, boolean>,
     votes: Map<number, AmendmentOpinionValues>,
     avatarPath: string | null,
     uploadPath: string | null,
     suspension: Date | null,
     moderator: boolean,
     bookmarks: Map<number, Date | true>,
     colorA?: string | null,
     colorB?: string | null
    ) {
        super(600) // 10 minutes
        this.id = id;
        this.passHash = password;
        this.nickname = nickname;
        this.email = email;
        this.fname = fname;
        this.lname = lname;
        this.amendments = amendments;
        this.avatarPath = avatarPath;
        this.colorA = colorA || "#099978"
        this.colorB = colorB || "#023189"
        this.opinions = opinions;
        this.votes = votes;
        this.bookmarks = bookmarks;
        this.suspension = suspension

        this.isModerator = moderator;
        this.uploadCachePath = uploadPath;
    }

    /**
     *
     * returns 1 is the opinion is positive
     * 0 if the opinion is negative
     * -1 if there is no opinion
     *
     */
    public checkOpinion(contentId: number): number {
        const fetched = this.opinions.get(contentId);
        if (fetched !== undefined) {
            return Number(fetched)
        }
        return -1
    }

    /**
     *
     * returns 1 is a new opinion was saved
     * 0 if the old opinion was changed
     * -1 if an old opinion was deleted
     *
     */
    public changeOpinion(contentId: number, positive: boolean): number {
        if (this.opinions.has(contentId)) {
            if (this.opinions.get(contentId) === positive) {
                this.opinions.delete(contentId)
                return -1
            }
            this.opinions.set(contentId, positive)
            return 0
        }
        this.opinions.set(contentId, positive)
        return 1
    }

    public async getBookmarkedContent(): Promise<MetaOutput[]> {
        let instance = await ContentManager.getInstance();
        let result: MetaOutput[] = new Array(this.bookmarks.size)
        let index = this.bookmarks.size - 1;
        for (let key of Array.from(this.bookmarks.keys())) {
            result[index] = await (await instance.getContentByID(key)).getMeta()
            index -= 1;
        }

        return result;
    }

    public async pushBookmark(contentId: number, options: { delete: true } | { add: true | Date, delete: false }) {
        let output;
        if (options.delete) {
            this.bookmarks.delete(contentId)
            output = await prisma.bookmarks.delete({
                where: {
                    userID_contentID: {
                        userID: this.id,
                        contentID: contentId
                    }
                }
            })
        } else {
            if (this.bookmarks.has(contentId)) {
                output = await prisma.bookmarks.update({
                    where: {
                        userID_contentID: {
                            userID: this.id,
                            contentID: contentId
                        }
                    },
                    data: {
                        reminderTimestamp: (options.add instanceof Date) ? options.add : undefined,
                        reminded: (options.add instanceof Date) ? false : undefined
                    }
                })
            } else {
                output = await prisma.bookmarks.create({
                    data: {
                        userID: this.id,
                        contentID: contentId,
                        reminded: false,
                        reminderTimestamp: (options.add instanceof Date) ? options.add : undefined
                    }
                })
            }
            this.bookmarks.set(contentId, options.add)
        }
        return output;
    }

    public checkBookmark(contentId: number): { reminder: boolean, reminderDate?: string } {
        let output = this.bookmarks.get(contentId)

        if (output) {
            if (output instanceof Date) {
                if (output > new Date())
                    return {
                        reminder: true,
                        reminderDate: output.getFullYear() + "." + Content.twoDigit(output.getMonth() + 1) + "." + Content.twoDigit(output.getDate())
                    }
            }
            return {
                reminder: true
            }
        }
        return {
            reminder: false
        }
    }

    public checkVote(amendmentId: number): AmendmentOpinionValues | undefined {
        const fetched = this.votes.get(amendmentId);
        if (fetched !== undefined) {
            return fetched
        }
        return undefined
    }

    /**
     *
     * returns 1 is a new vote was saved
     * 0 if the old vote was changed
     * -1 if an old vote was deleted
     *
     */
    public changeVote(amendmentId: number, newValue: AmendmentOpinionValues): number {
        if (this.votes.has(amendmentId)) {
            if (this.votes.get(amendmentId) === newValue) {
                this.votes.delete(amendmentId)
                return -1
            }
            this.votes.set(amendmentId, newValue)
            return 0
        }
        this.votes.set(amendmentId, newValue)
        return 1
    }

    public async getVoteData(requestedAmendmentsIDs: number[]): Promise<VotingSupport[]> {
        let finalArray: VotingSupport[] = new Array<VotingSupport>();
        let amendmentManagerInstance = AmendmentManager.getInstance();
        for (let id of requestedAmendmentsIDs) {
            if (this.votes.has(id)) {
                let amendment = await amendmentManagerInstance.retrieve(id)
                finalArray.push(await amendment.getSupports(this.id))
            }
        }
        return finalArray
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

    public async getAllDetails(): Promise<UserDetails> {
        super.refresh()
        let finalPath = "/images/defProfile.png";
        if (this.avatarPath) {
            finalPath = "/api/images/" + this.avatarPath
        }
        return {
            nickname: this.nickname,
            email: this.email,
            fname: this.fname,
            lname: this.lname,
            XP: await this.getXP(),
            avatarPath: finalPath,
            colorA: this.colorA,
            colorB: this.colorB
        }
    }

    public async getXP(): Promise<number> {
        let totalXP = 0;

        for (let amend of this.amendments) {
            let content;

            try {
                content = await ContentManager.getInstance().getContentByID(amend.getTargetID());
            } catch {
            }

            if (content) {
                totalXP += amend.getSignificance() * content.getSignificance()
            }
        }

        return Math.floor(totalXP / 100);
    }

    public async getAmendments(): Promise<AmendmentOutput[]> {
        let result: AmendmentOutput[] = []

        for (let amendment of this.amendments) {
            result.push(await amendment.getFullAmendmentOutput())
        }

        return result;
    }

    public addAmendment(amendment: Amendment) {
        this.amendments.push(amendment)
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

    public async setNickname(nickname: string) {
        super.refresh()

        await UserManager.getInstance().updateNick(this.nickname, nickname)
        this.nickname = nickname;
    }

    public async setEmail(email: string) {
        super.refresh()

        await UserManager.getInstance().updateEmail(this.email, email)
        this.email = email;
    }

    public async setFname(fname: string) {
        super.refresh()

        this.fname = fname;
        await prisma.user.update({
            where: {
                ID: this.id
            },
            data: {
                fname: fname
            }
        })
    }

    public async setLname(lname: string) {
        super.refresh()

        this.lname = lname;
        await prisma.user.update({
            where: {
                ID: this.id
            },
            data: {
                lname: lname
            }
        })
    }

    public async setPassword(password: string) {
        super.refresh()

        User.evaluatePassword(password) //evaluate and if there are no errors continue
        this.passHash = "";

        await User.generateHash(password).then(async (hash: string) => {
            this.passHash = hash;
            await prisma.user.update({
                where: {
                    ID: this.id
                },
                data: {
                    passHash: this.passHash
                }
            })
        });
    }

    public async updateManager() {
        await UserManager.getInstance().updateUserNonIdentifier(this.email, this.fname, this.lname, this.passHash, this.avatarPath)
    }

    public getID() {
        return this.id;
    }

    public getAvatarPath() {
        return this.avatarPath;
    }

    public async setAvatarPath(newAvatarPath: string | null) {
        super.refresh()

        this.avatarPath = newAvatarPath;

        await prisma.user.update({
            where: {
                ID: this.id
            },
            data: {
                avatarFile: newAvatarPath
            }
        })
    }

    public getUploadCachePath() {
        return this.uploadCachePath;
    }

    public async setUploadCachePath(newUploadCachePath: string | null) {
        super.refresh()

        this.uploadCachePath = newUploadCachePath;

        await prisma.user.update({
            where: {
                ID: this.id
            },
            data: {
                uploadCacheFile: this.uploadCachePath
            }
        })
    }

    public getIsModerator() {
        return this.isModerator
    }

    public checkSuspension(): boolean {
        if (this.suspension) {
            return this.suspension <= new Date()
        }
        return true
    }

    public async setSuspended(newDate: Date) {
        this.suspension = newDate;
        await prisma.user.update({
            where: {
                ID: this.id
            },
            data: {
                suspension: this.suspension
            }
        })
    }

    public async setColorA(newColor: string) {
        this.colorA = newColor

        await prisma.user.update({
            where: {
                ID: this.id
            },
            data: {
                colorA: this.colorA
            }
        })
    }

    public async setColorB(newColor: string) {
        this.colorB = newColor

        await prisma.user.update({
            where: {
                ID: this.id
            },
            data: {
                colorB: this.colorB
            }
        })
    }
}
