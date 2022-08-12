import PartAmendment from "./PartAmendment";

class PartModificationAmendment extends PartAmendment {
    private readonly newLessonPartID : number;

    public constructor(id : number, authorID : number | null, targetID : number, lessonPartID : number | undefined, newPartID : number, creationDate? : Date) {
        super(id, authorID, targetID, lessonPartID, creationDate);
        this.newLessonPartID = newPartID;
    }

    public getNewPartID(){
        return this.newLessonPartID;
    }
}

export default PartModificationAmendment;