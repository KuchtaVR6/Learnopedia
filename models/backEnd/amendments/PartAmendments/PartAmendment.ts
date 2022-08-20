import Amendment from "../Amendment";

class PartAmendment extends Amendment {
    private readonly lessonPartID : number | undefined;

    public constructor(id : number, authorID : number | null, targetID : number, lessonPartID : number | undefined, significance : number, tariff : number, creationDate? : Date, applied? : boolean) {
        super(id, authorID, targetID, significance, tariff, creationDate, applied);
        this.lessonPartID = lessonPartID;
    }

    public getLessonPartID() {
        return this.lessonPartID;
    }

    public fullyFetched()
    {
        return true;
    }
}

export default PartAmendment;