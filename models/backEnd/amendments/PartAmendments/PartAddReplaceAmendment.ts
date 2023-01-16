import PartAmendment from "./PartAmendment";
import {displayableOutput} from "../../lessonParts/LessonPart";
import {AmendmentOpinionValues, SpecificAmendmentOutput} from "../Amendment";
import LessonPartManager from "../../lessonParts/LessonPartManager";
import ContentManager from "../../contents/ContentManager";

export type PartAddReplaceAmendmentOutput = {
    __typename: "PartAddReplaceAmendmentOutput"
    change : displayableOutput | null
    seqNumber : number
    oldID? : number
}

class PartAddReplaceAmendment extends PartAmendment{
    private readonly oldID? : number;
    private seqNumber : number;

    public constructor(
        id : number,
        authorID : number | null,
        targetID : number,
        lessonPartID : number | undefined,
        seqNumber : number,
        secondary :
            {dbInput : false} |
            {dbInput : true, creationDate : Date, significance : number, tariff : number, applied : boolean, opinions?: Map<number,AmendmentOpinionValues>, vetoed : boolean},
        oldID? : number)
    {
        if(!secondary.dbInput){
            let tariff: number;

            if (oldID) {
                tariff = 101;
            } else {
                tariff = 1;
            }

            super(id, authorID, targetID, lessonPartID, 100000, tariff);
        }
        else{
            super(id, authorID, targetID, lessonPartID, secondary.significance, secondary.tariff, secondary.vetoed, secondary.creationDate, secondary.applied, secondary.opinions)
        }

        this.oldID = oldID;
        this.seqNumber = seqNumber;
    }

    public getOldID() {
        return this.oldID
    }

    public getNewSeqNum(){
        return this.seqNumber
    }

    public moveNewSeqNum(){
        this.seqNumber += 1;
    }

    protected async getSpecificOutput() : Promise<SpecificAmendmentOutput> {
        let lessonPartID = super.getLessonPartID()
        if(lessonPartID) {
            return {
                __typename: "PartAddReplaceAmendmentOutput",
                change: (await LessonPartManager.getInstance().retrieve(lessonPartID)).getDisplayable(),
                seqNumber: this.seqNumber,
                oldID: this.oldID
            }
        }
        else {
            return {
                __typename: "PartAddReplaceAmendmentOutput",
                change: null,
                seqNumber: this.seqNumber,
                oldID: this.oldID
            }
        }
    }

    public async applyThisAmendment() {
        let content = await ContentManager.getInstance().getSpecificByID(this.getTargetID())

        await content.applyPartAddReplaceAmendment(this)

        await content.purgeListEdits()
    }
}

export default PartAddReplaceAmendment;