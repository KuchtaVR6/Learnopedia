import Amendment from "../Amendment";

class PartAmendment extends Amendment {
    private readonly lessonPartID : number | undefined;

    public constructor(id : number, authorID : number | null, targetID : number, lessonPartID : number | undefined, creationDate? : Date) {
        super(id, authorID, targetID, creationDate);
        this.lessonPartID = lessonPartID;
    }

    public getLessonPartID() {
        return this.lessonPartID;
    }
}

export default PartAmendment;