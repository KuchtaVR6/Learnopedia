import Amendment, {
    AmendmentOpinionValues,
    AmendmentTypes,
    LevelSupport,
    SpecificAmendmentOutput,
    VotingSupport
} from "./Amendment";
import Keyword from "../contents/keywords/Keyword";
import {contentShareOutput, ContentType} from "../contents/Content";
import {ContentNeedsParent} from "../tools/Errors";
import KeywordManager from "../contents/keywords/KeywordManager";
import ContentManager from "../contents/ContentManager";

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
        secondary :
            {dbInput : false} |
            {dbInput : true, creationDate : Date, significance : number, tariff : number, applied : boolean, opinions?: Map<number,AmendmentOpinionValues>, vetoed : boolean})
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
            super(id, args.authorID, args.targetID, secondary.significance, secondary.tariff, secondary.vetoed, secondary.creationDate, secondary.applied, secondary.opinions)
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

    public getType() : AmendmentTypes {
        return AmendmentTypes.CreationAmendment
    }

    public async getSupports(userID? : number) : Promise<VotingSupport>{

        let contentManagerInstance = await ContentManager.getInstance()

        let target = await contentManagerInstance.getSpecificByID(this.parentID!)

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

    public async applyThisAmendment() {
        await ContentManager.getInstance().applyContentCreation(this)
    }
}

export default CreationAmendment;