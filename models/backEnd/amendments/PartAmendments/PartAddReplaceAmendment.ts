import PartAmendment from "./PartAmendment";
import {displayableOutput} from "../../lessonParts/LessonPart";
import {SpecificAmendmentOutput} from "../Amendment";
import LessonPartManager from "../../lessonParts/LessonPartManager";

export type PartAddReplaceAmendmentOutput = {
    __typename: "PartAddReplaceAmendmentOutput"
    change : displayableOutput | null
    seqNumber : number
    oldID? : number
}

class PartAddReplaceAmendment extends PartAmendment{
    private readonly oldID? : number;
    private readonly seqNumber : number;

    public constructor(
        id : number,
        authorID : number | null,
        targetID : number,
        lessonPartID : number | undefined,
        seqNumber : number,
        secondary : {dbInput : false} | {dbInput : true, creationDate : Date, significance : number, tariff : number, applied : boolean},
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
            super(id, authorID, targetID, lessonPartID, secondary.significance, secondary.tariff, secondary.creationDate, secondary.applied)
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
}

export default PartAddReplaceAmendment;