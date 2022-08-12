import LessonPart, {displayableOutput} from "./LessonPart";

export type ParagraphOutput = {
    basicText: string,
    advancedText: string
}

class Paragraph extends LessonPart {

    private readonly basicText: string;
    private readonly advText: string | null;

    public constructor(id: number, seqNum: number, bText: string, aText: string | null) {
        super(id, seqNum);

        this.basicText = bText;
        this.advText = aText;
    }

    public getDisplayable(): displayableOutput {
        if (this.advText) {
            return {
                id : this.getID(),
                seqNumber: this.getSeqNumber(),
                output:
                    {
                        __typename: "ParagraphOutput",
                        basicText: this.basicText,
                        advancedText: this.advText
                    }
            }
        }
        return {
            id : this.getID(),
            seqNumber: this.getSeqNumber(),
            output:
                {
                    __typename: "ParagraphOutput",
                    basicText: this.basicText,
                    advancedText: ""
                }
        }
    }
}

export default Paragraph;