import Amendment, {AmendmentOpinionValues, SpecificAmendmentOutput} from "./Amendment";
import {ContentType} from "../contents/Content";

export type ListAmendmentOutput = {
    __typename: "ListAmendmentOutput",
    listChanges : { ChildID?: number, LessonPartID?: number, newSeqNumber?: number, delete?: boolean }[]
}

class ListAmendment extends Amendment {
    public readonly changes: { ChildID?: number, LessonPartID?: number, newSeqNumber?: number, delete?: boolean }[];

    public constructor(
        id: number,
        authorID: number | null,
        targetID: number,
        changes: { ChildID?: number, LessonPartID?: number, newSeqNumber?: number, delete?: boolean }[],
        secondary :
            {dbInput : false, targetType: ContentType} |
            {dbInput : true, creationDate : Date, significance : number, tariff : number, applied : boolean, opinions?: Map<number,AmendmentOpinionValues>, vetoed : boolean})
    {
        if(!secondary.dbInput){
            let significance = 0;

            let elemSignificance: number;

            switch (secondary.targetType) {
                case ContentType.COURSE:
                    elemSignificance = 100;
                    break;
                case ContentType.CHAPTER:
                    elemSignificance = 1000;
                    break;
                case ContentType.LESSON:
                    elemSignificance = 10000;
                    break;
            }

            changes.map((change) => {
                if (change.delete) {
                    significance += elemSignificance
                } else {
                    significance += 1;
                }
            })

            super(id, authorID, targetID, significance, 100);
        }
        else{
            super(id, authorID, targetID, secondary.significance, secondary.tariff, secondary.vetoed, secondary.creationDate, secondary.applied, secondary.opinions)
        }
        this.changes = changes;
    }

    protected async getSpecificOutput() : Promise<SpecificAmendmentOutput> {
        return {
            __typename: "ListAmendmentOutput",
            listChanges : this.changes
        }
    }

    public fullyFetched()
    {
        return true;
    }
}

export default ListAmendment;