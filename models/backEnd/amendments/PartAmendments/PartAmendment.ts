import Amendment, {AmendmentOpinionValues} from "../Amendment";

class PartAmendment extends Amendment {
    private readonly lessonPartID : number | undefined;

    public constructor(
        id : number,
        authorID : number | null,
        targetID : number,
        lessonPartID : number | undefined,
        significance : number,
        tariff : number,
        vetoed? : boolean,
        creationDate? : Date,
        applied? : boolean,
        opinions?: Map<number,AmendmentOpinionValues>
        ) {
        super(id, authorID, targetID, significance, tariff, vetoed, creationDate, applied, opinions);
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