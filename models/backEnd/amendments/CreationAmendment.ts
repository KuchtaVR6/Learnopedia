import Amendment, {SpecificAmendmentOutput} from "./Amendment";
import Keyword from "../contents/keywords/Keyword";
import {ContentType} from "../contents/Content";
import {ContentNeedsParent} from "../tools/Errors";
import KeywordManager from "../contents/keywords/KeywordManager";

export type CreationAmendmentOutput = {
    __typename: "CreationAmendmentOutput",
    name : string,
    description : string,
    keywords : {ID : number, Score : number, word : string}[],
    seqNumber : number,
}

class CreationAmendment extends Amendment{
    public readonly name : string;
    public readonly description : string;
    public readonly keywords : Keyword[];
    public readonly seqNumber : number;
    public readonly type : ContentType;
    public readonly parentID : number | undefined;

    public constructor(
        id : number,
        args : {authorID : number | null, targetID : number, name : string, description : string, keywords : Keyword[], seqNumber : number, type : ContentType, parentID? : number},
        secondary : {dbInput : false} | {dbInput : true, creationDate : Date, significance : number, tariff : number, applied : boolean})
    {
        if(!secondary.dbInput){
            if (!args.parentID && args.type !== ContentType.COURSE) {
                throw new ContentNeedsParent();
            }

            let significance: number;

            switch (args.type) {
                case ContentType.COURSE:
                    significance = 100;
                    break;
                case ContentType.CHAPTER:
                    significance = 1000;
                    break;
                case ContentType.LESSON:
                    significance = 10000;
                    break;
            }

            super(id, args.authorID, args.targetID, significance, 1);
        }
        else{
            super(id, args.authorID, args.targetID, secondary.significance, secondary.tariff, secondary.creationDate, secondary.applied)
        }

        this.name = args.name;
        this.description = args.description;
        this.keywords = args.keywords;
        this.seqNumber = args.seqNumber;
        this.type = args.type;

        this.parentID = args.parentID;
    }

    protected async getSpecificOutput() : Promise<SpecificAmendmentOutput> {
        return {
            __typename: "CreationAmendmentOutput",
            name : this.name,
            description : this.description,
            keywords : KeywordManager.readKeywords(this.keywords),
            seqNumber : this.seqNumber,
        }
    }

    public fullyFetched()
    {
        return true;
    }
}

export default CreationAmendment;