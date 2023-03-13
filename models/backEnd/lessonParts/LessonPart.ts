import {UnsupportedOperation} from "../tools/Errors";
import {ParagraphOutput} from "./Paragraph";
import {Expirable} from "../tools/Expirable";
import prisma from "../../../prisma/prisma";
import {QuizQuestionOutput} from "./QuizQuestion";
import {EmbeddableOutput} from "./Embeddable";

export type displayableOutput = {
    id : number,
    seqNumber : number,
    output : { __typename: "ParagraphOutput" } & ParagraphOutput |
        { __typename : "QuizQuestionOutput"} & QuizQuestionOutput |
        { __typename : "EmbeddableOutput" } & EmbeddableOutput
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

    public abstract getDisplayable() : displayableOutput

    public setSeqNumber(number : number) {
        this.seqNumber = number;
    }

    public async hide() {
        await prisma.lessonpart.update({
            where : {
                LessonPartID : this.id
            },
            data : {
                LessonID : null
            }
        })
    }
}

export default LessonPart;
