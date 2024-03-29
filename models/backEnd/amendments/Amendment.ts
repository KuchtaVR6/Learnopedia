import {UserManager} from "../managers/UserManager";
import prisma from "../../../prisma/prisma";
import ContentManager from "../contents/ContentManager";
import {contentShareOutput, ContentType, MetaOutput} from "../contents/Content";
import {Expirable} from "../tools/Expirable";
import {User} from "../User";
import {ContentNotFetched} from "../tools/Errors";
import {
    AdoptionAmendmentOutput,
    CreationAmendmentOutput,
    ListAmendmentOutput, MetaAmendmentOutput,
    PartAddReplaceAmendmentOutput
} from "./AmendmentOutputTypes";

export type AmendmentOutput = {
    id : number,
    creatorNickname : string,
    creationDate : string,
    significance : number,
    tariff : number,
    targetMeta : MetaOutput,
    applied : boolean,
    vetoed : boolean,
    otherDetails : SpecificAmendmentOutput
}

export type VotingSupport = {
    amendmentID : number,
    individualSupports : LevelSupport[]
    userOP?: number
}

export type LevelSupport = {
    negatives : number,
    positives : number,
    max : number,
}

export enum AmendmentOpinionValues {
    Positive,
    Negative,
    Report,
}

export enum AmendmentTypes {
    AdoptionAmendment,
    PartAddReplaceAmendment,
    CreationAmendment,
    ListAmendment,
    MetaAmendment,
}

export type SpecificAmendmentOutput = AdoptionAmendmentOutput | PartAddReplaceAmendmentOutput | CreationAmendmentOutput | ListAmendmentOutput | MetaAmendmentOutput

class Amendment extends Expirable{

    protected targetID : number;
    protected id : number;
    private readonly creationDate : Date;
    private readonly authorID : number | null;
    private readonly significance : number;
    private readonly tariff : number;
    private applied : boolean;
    private vetoed : boolean;
    protected opinions : Map<number, AmendmentOpinionValues>;

    public constructor(
        id : number,
        authorID : number | null,
        targetID : number,
        significance : number,
        tariff : number,
        vetoed? : boolean,
        creationDate? : Date,
        applied? : boolean,
        opinions? : Map<number, AmendmentOpinionValues>
    ) {
        super();
        if(creationDate)
        {
            this.creationDate = creationDate;
        }
        else{
            this.creationDate = new Date();
        }

        if(applied)
        {
            this.applied = applied;
        }
        else{
            this.applied = false;
        }

        if(opinions)
        {
            this.opinions = opinions
        }
        else{
            this.opinions = new Map<number, AmendmentOpinionValues>()
        }

        if(vetoed)
        {
            this.vetoed = vetoed
        }
        else{
            this.vetoed = false
        }

        this.id = id
        this.authorID = authorID;
        this.targetID = targetID;

        this.significance = significance;
        this.tariff = tariff;
    }

    public getAuthorID(){
        return this.authorID;
    }

    public getAuthor(){
        if(this.authorID)
        {
            return UserManager.getInstance().getUserID(this.authorID);
        }
        else{
            return UserManager.getInstance().deletedUser();
        }

    }

    public getSignificance(){
        return this.significance
    }

    public getTariff() : number{
        return this.tariff
    }

    public getCost() : number{
        return this.significance * this.tariff
    }

    public getCreationDate(){
        return this.creationDate;
    }

    public getID() {
        if(this.id<0)
        {
            throw new Error("ID NOT READY CRITICAL")
        }
        return this.id
    }

    public setID(id : number) {
        this.id = id
    }

    private static twoDigit(input: number) {
        if (input < 10) {
            return "0" + input.toString()
        }
        return input.toString()
    }

    private formatCreationDate() : string{
        return Amendment.twoDigit(this.creationDate.getDate()) + "." + Amendment.twoDigit(this.creationDate.getMonth() + 1) + "." + this.creationDate.getFullYear()
    }

    public async getSupports(userID? : number) : Promise<VotingSupport>{

        let contentManagerInstance = await ContentManager.getInstance()

        let target = await contentManagerInstance.getSpecificByID(this.targetID)

        let finalArray : LevelSupport[] = [
            {
                max: 0,
                positives: 0,
                negatives: 0,
            },
            {
                max: 0,
                positives: 0,
                negatives: 0,
            },
            {
                max: 0,
                positives: 0,
                negatives: 0,
            }
        ];

        let userOP : number | undefined = undefined; // -2 report, -1 negative, 1 positive

        const changeFinalArray = (level : contentShareOutput,levelNo : number, op : AmendmentOpinionValues) => {
            finalArray[levelNo].max = level.maximum
            if(op===AmendmentOpinionValues.Positive)
            {
                finalArray[levelNo].positives += level.owned
            }
            else {
                finalArray[levelNo].negatives += level.owned
            }
        }

        this.opinions.forEach((op, user) => {
            let significances = target.getContentShareOfUser(user);

            if(userID === user) {
                switch (op) {
                    case AmendmentOpinionValues.Negative:
                        userOP = -1;
                        break;
                    case AmendmentOpinionValues.Positive:
                        userOP = 1;
                        break;
                    case AmendmentOpinionValues.Report:
                        userOP = -2;
                        break;
                }
            }

            significances.forEach((level) => {
                switch (level.level)
                {
                    case ContentType.LESSON:
                        changeFinalArray(level,2,op)
                        break;
                    case ContentType.CHAPTER:
                        changeFinalArray(level,1,op)
                        break;
                    case ContentType.COURSE:
                        changeFinalArray(level,0,op)
                        break;
                }
            })
        })

        let cutArray : LevelSupport[] = [];

        finalArray.map((each) => {
            if(each.max>0)
            {
                cutArray.push(each)
            }
        })

        return {
            amendmentID : this.id,
            individualSupports : cutArray,
            userOP: userOP
        }
    }

    public async getFullAmendmentOutput() : Promise<AmendmentOutput> {
        let meta : MetaOutput;
        try {
            meta = await (await ContentManager.getInstance().getContentByID(this.targetID)).getMeta();
        }
        catch {
            meta = (await ContentManager.getInstance()).returnDeletedMeta()
        }
        return {
            id : this.id,
            creatorNickname : (await this.getAuthor()).getNickname(),
            creationDate : this.formatCreationDate(),
            significance : this.significance,
            tariff : this.tariff,
            targetMeta : meta,
            vetoed : this.vetoed,
            applied : this.applied,
            otherDetails : await this.getSpecificOutput()
        }
    }

    protected async getSpecificOutput(): Promise<SpecificAmendmentOutput> {
        throw new Error("Amendment not fetched")
    }

    public async getApplied() {
        this.applied = true;
        await prisma.amendment.update({
            where : {
                ID : this.getID()
            },
            data : {
                applied : true
            }
        })
    }

    public getTargetID() {
        return this.targetID
    }

    public setTargetID(targetID : number) {
        this.targetID = targetID
    }

    public fullyFetched() {
        return false;
    }

    public async vote(user: User, vote: AmendmentOpinionValues) {
        let ans = user.changeVote(this.id, vote);
        if (ans === 1) {
            this.opinions.set(user.getID(),vote)

            await prisma.amendmentopinion.create({
                data: {
                    userID: user.getID(),
                    amendmentID: this.id,
                    positive: vote===AmendmentOpinionValues.Positive,
                    negative: vote===AmendmentOpinionValues.Negative,
                    report: vote===AmendmentOpinionValues.Report,
                }
            })
        } else if (ans === 0) {
            this.opinions.set(user.getID(),vote)

            await prisma.amendmentopinion.update({
                where : {
                  userID_amendmentID : {userID: user.getID(), amendmentID : this.id}
                },
                data: {
                    positive: vote===AmendmentOpinionValues.Positive,
                    negative: vote===AmendmentOpinionValues.Negative,
                    report: vote===AmendmentOpinionValues.Report,
                }
            })
        } else {
            this.opinions.delete(user.getID())

            await prisma.amendmentopinion.delete({
                where: {
                    userID_amendmentID: {userID: user.getID(), amendmentID: this.id}
                }
            })
        }
    }

    public async veto() {
        this.vetoed = true

        await prisma.amendment.update({
            where : {
                ID: this.id
            },
            data : {
                vetoed: true
            }
        })
    }

    public getVeto() {
        return this.vetoed
    }

    public async applyThisAmendment() {
        throw ContentNotFetched
    }

    public getValueOfApplied() {
        return this.applied;
    }

    public async checkFulfillmentAndReturn() : Promise<VotingSupport>
    {
        let output = await this.getSupports()

        let multiplication = 2**(output.individualSupports.length-1)

        if(!this.getVeto() && !this.applied) {
            for (let thisLevel of output.individualSupports) {
                let required = this.getCost() * multiplication
                if (required > thisLevel.max) {
                    required = thisLevel.max
                }

                if (required <= thisLevel.negatives) {
                    await this.veto()
                } else if (required <= thisLevel.positives) {
                    if(!this.applied) {
                        await this.applyThisAmendment()
                    }
                }

                multiplication = multiplication / 2;
            }
        }

        return output
    }

    public getType() : AmendmentTypes {
        throw new ContentNotFetched()
    }
}

export default Amendment;