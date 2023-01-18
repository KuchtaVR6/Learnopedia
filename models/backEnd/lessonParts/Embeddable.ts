import LessonPart, {displayableOutput} from "./LessonPart";

export type EmbeddableOutput = {
    uri: string,
    type: string
}

export class Embeddable extends LessonPart {

    private readonly uri: string;
    private readonly type: string;

    public constructor(id: number, seqNumber: number, uri: string, type: string) {
        super(id, seqNumber);

        this.type = type;

        this.uri = uri;
    }

    public getDisplayable(): displayableOutput {
        return {
            id: this.getID(),
            seqNumber: this.getSeqNumber(),
            output:
                {
                    __typename: "EmbeddableOutput",
                    uri : this.uri,
                    type : this.type
            }
        }
    }
}