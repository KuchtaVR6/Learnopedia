import {UserManager} from "../managers/UserManager";
import prisma from "../../../prisma/prisma";
import {AdoptionAmendmentOutput} from "./AdoptionAmendment";
import PartAddReplaceAmendment, {PartAddReplaceAmendmentOutput} from "./PartAmendments/PartAddReplaceAmendment";
import {CreationAmendmentOutput} from "./CreationAmendment";
import {ListAmendmentOutput} from "./ListAmendment";
import {MetaAmendmentOutput} from "./MetaAmendment";
import ContentManager from "../contents/ContentManager";
import {MetaOutput} from "../contents/Content";
import {Expirable} from "../tools/Expirable";

export type AmendmentOutput = {
    id : number,
    creatorNickname : string,
    creationDate : string,
    significance : number,
    tariff : number,
    targetMeta : MetaOutput,
    applied : boolean,
    otherDetails : SpecificAmendmentOutput
}

export type SpecificAmendmentOutput = AdoptionAmendmentOutput | PartAddReplaceAmendmentOutput | CreationAmendmentOutput | ListAmendmentOutput | MetaAmendmentOutput

class Amendment extends Expirable{

    protected readonly targetID : number;
    private id : number;
    private readonly creationDate : Date;
    private readonly authorID : number | null;
    private readonly significance : number;
    private readonly tariff : number;
    private applied : boolean;

    public constructor(id : number, authorID : number | null, targetID : number, significance : number, tariff : number, creationDate? : Date, applied? : boolean) {
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

    public async getFullAmendmentOutput() : Promise<AmendmentOutput> {
        return {
            id : this.id,
            creatorNickname : (await this.getAuthor()).getNickname(),
            creationDate : this.formatCreationDate(),
            significance : this.significance,
            tariff : this.tariff,
            targetMeta : await (await ContentManager.getInstance().getContentByID(this.targetID)).getMeta(),
            applied : this.applied,
            otherDetails : await this.getSpecificOutput()
        }
    }

    protected async getSpecificOutput(): Promise<SpecificAmendmentOutput> {
        throw new Error("Amendment not fetched")
    }

    public async getApplied()
    {
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

    public getTargetID()
    {
        return this.targetID
    }

    public fullyFetched()
    {
        return false;
    }
}

export default Amendment;