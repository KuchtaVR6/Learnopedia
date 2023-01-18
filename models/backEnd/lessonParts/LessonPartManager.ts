import {NotFoundException, UnsupportedOperation} from "../tools/Errors";
import prisma from "../../../prisma/prisma";
import LessonPart from "./LessonPart";
import Paragraph, {ParagraphOutput} from "./Paragraph";
import {Embeddable, EmbeddableOutput} from "./Embeddable";
import {QuizQuestion, QuizQuestionOutput} from "./QuizQuestion";

export type lessonPartArgs = {
    type : lessonPartTypes.PARAGRAPH,
    content : ParagraphInput
} | {
    type : lessonPartTypes.EMBEDDABLE,
    content : EmbeddableOutput
} | {
    type : lessonPartTypes.QUIZ_QUESTION,
    content : QuizQuestionOutput
}

export enum lessonPartTypes {
    PARAGRAPH,
    EMBEDDABLE,
    QUIZ_QUESTION
}

export type ParagraphInput = {
    basicText : string,
    advancedText : string | null
}

class LessonPartManager {

    private static instance : LessonPartManager | null = null;

    private constructor() {
    }

    public static getInstance() {
        if(!this.instance)
        {
            this.instance = new LessonPartManager()
        }
        return this.instance;
    }

    public async push(seqNumber : number, args : lessonPartArgs) : Promise<number> {
        if(args.type === lessonPartTypes.PARAGRAPH)
        {
            let output = await prisma.lessonpart.create({
                data : {
                    seqNumber : seqNumber,
                    paragraph: {
                        create : {
                            basicText : args.content.basicText,
                            advancedText : args.content.advancedText
                        }
                    }
                }
            })
            return output.LessonPartID
        }
        else if(args.type === lessonPartTypes.EMBEDDABLE) {
            let output = await prisma.lessonpart.create({
                data : {
                    seqNumber : seqNumber,
                    embeddable: {
                        create: {
                            type : args.content.type,
                            uri : args.content.uri
                        }
                    }
                }
            })
            return output.LessonPartID
        }
        else if(args.type === lessonPartTypes.QUIZ_QUESTION) {
            let output = await prisma.lessonpart.create({
                data : {
                    seqNumber : seqNumber,
                    quizquestion: {
                        create: {
                            type : args.content.type,
                            question: args.content.question,
                            answer : {
                                createMany : {
                                    data : args.content.answer
                                }
                            }
                        }
                    }
                }
            })
            return output.LessonPartID
        }
        else{
            throw UnsupportedOperation;
        }
    }

    public async retrieve(id : number) : Promise<LessonPart> {
        let output = await prisma.lessonpart.findUnique({
            where : {
                LessonPartID : id
            },
            include : {
                paragraph: {
                    select : {
                        basicText: true,
                        advancedText: true
                    }
                },
                embeddable: true,
                quizquestion: {
                    include : {
                        answer: true
                    }
                }
            }
        })

        if(!output)
        {
            throw new NotFoundException("LessonPart",id)
        }

        if(output.paragraph)
        {
            return new Paragraph(output.LessonPartID,output.seqNumber,output.paragraph.basicText,output.paragraph.advancedText)
        }
        else if(output.embeddable)
        {
            return new Embeddable(output.LessonPartID,output.seqNumber,output.embeddable.uri,output.embeddable.type)
        }
        else if(output.quizquestion)
        {
            return new QuizQuestion(
                output.LessonPartID,
                output.seqNumber,
                output.quizquestion.question,
                output.quizquestion.type,
                output.quizquestion.answer.map(
                    (each) =>
                    {return {
                        answerID : each.AnswerID,
                        content : each.content,
                        feedback : each.feedback? each.feedback : undefined,
                        correct : each.correct
                    }}))
        }
        else{
            throw UnsupportedOperation;
        }
    }
}

export default LessonPartManager;