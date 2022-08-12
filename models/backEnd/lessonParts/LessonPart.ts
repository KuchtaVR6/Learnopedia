import {UnsupportedOperation} from "../tools/Errors";
import {ParagraphOutput} from "./Paragraph";
import {Expirable} from "../tools/Expirable";

export type displayableOutput = {
    id : number,
    seqNumber : number,
    output : {
        __typename: "ParagraphOutput"
    } & ParagraphOutput
}

abstract class LessonPart extends Expirable{
    private readonly id : number;
    private seqNumber : number;

    protected constructor(id : number,seqNumber : number) {
        super();
        this.id = id;
        this.seqNumber = seqNumber
    }

    public getID()
    {
        return this.id
    }

    public getSeqNumber(){
        return this.seqNumber
    }

    public getDisplayable() : displayableOutput{
        throw new UnsupportedOperation("LessonPart","getDisplayable")
    }

    public setSeqNumber(number : number) {
        this.seqNumber = number;
    }
}

export default LessonPart;
