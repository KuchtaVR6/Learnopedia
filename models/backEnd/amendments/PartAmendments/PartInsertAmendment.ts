import PartAmendment from "./PartAmendment";

class PartInsertAmendment extends PartAmendment{
    private seqNumber : number;
    private moveExisting : boolean; //inserting can be used to move lesson part if this flag is true

    public constructor(id : number, authorID : number | null, targetID : number, lessonPartID : number | undefined, seqNumber : number, moveExisiting : boolean, creationDate? : Date) {
        super(id, authorID, targetID, lessonPartID, creationDate);
        this.seqNumber = seqNumber;
        this.moveExisting = moveExisiting;
    }

    public getNewSeqNum() {
        return this.seqNumber
    }

    public isMove() {
        return this.moveExisting;
    }
}

export default PartInsertAmendment;