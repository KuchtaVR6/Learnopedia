import Amendment, {AmendmentOpinionValues, SpecificAmendmentOutput} from "./Amendment";
import {EmptyModification} from "../tools/Errors";
import Keyword from "../contents/keywords/Keyword";
import {ContentType} from "../contents/Content";
import KeywordManager from "../contents/keywords/KeywordManager";
import ContentManager from "../contents/ContentManager";

export type MetaAmendmentOutput = {
    __typename: "MetaAmendmentOutput",
    newName? : string,
    newDescription? : string,
    addedKeywords? : { ID : number, Score : number, word : string }[],
    deletedKeywords? : { ID : number, Score : number, word : string }[]
}

class MetaAmendment extends Amendment{
    public readonly newName : string | undefined;
    public readonly newDescription : string | undefined;
    public readonly addedKeywords : Keyword[] | undefined;
    public readonly deletedKeywords : Keyword[] | undefined;

    public constructor(
        id : number,
        authorID : number | null,
        targetID : number,
        args : {newName? : string, newDescription? : string, addedKeywords? : Keyword[], deletedKeywords? : Keyword[]},
        secondary :
            {dbInput : false, targetType: ContentType} |
            {dbInput : true, creationDate : Date, significance : number, tariff : number, applied : boolean, opinions?: Map<number,AmendmentOpinionValues>, vetoed : boolean},
    ) {
        if(!secondary.dbInput){
            if (!args.newName && !args.newDescription && !args.addedKeywords && !args.deletedKeywords) {
                throw new EmptyModification();
            }

            let tariff = 0;

            if (args.newName) {
                tariff += 10;
            }
            if (args.newDescription) {
                tariff += 10;
            }
            if (args.addedKeywords) {
                tariff += args.addedKeywords.length;
            }
            if (args.deletedKeywords) {
                tariff += args.deletedKeywords.length * 10;
            }

            let significance: number;

            switch (secondary.targetType) {
                case ContentType.COURSE:
                    significance = 10000;
                    break;
                case ContentType.CHAPTER:
                    significance = 1000;
                    break;
                case ContentType.LESSON:
                    significance = 100;
                    break;
            }

            super(id, authorID, targetID, significance, tariff);
        }
        else{
            super(id, authorID, targetID, secondary.significance, secondary.tariff, secondary.vetoed, secondary.creationDate, secondary.applied, secondary.opinions)
        }

        this.newName = args.newName;
        this.newDescription = args.newDescription;
        this.addedKeywords = args.addedKeywords;
        this.deletedKeywords = args.deletedKeywords;
    }

    protected async getSpecificOutput() : Promise<SpecificAmendmentOutput> {
        return {
            __typename: "MetaAmendmentOutput",
            newName : this.newName,
            newDescription : this.newDescription,
            addedKeywords : this.addedKeywords? KeywordManager.readKeywords(this.addedKeywords) : undefined,
            deletedKeywords : this.deletedKeywords? KeywordManager.readKeywords(this.deletedKeywords) : undefined
        }
    }

    public fullyFetched()
    {
        return true;
    }

    public async applyThisAmendment() {
        let content = await ContentManager.getInstance().getSpecificByID(this.getTargetID())

        await content.applyMetaAmendment(this)
    }
}

export default MetaAmendment;