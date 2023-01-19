import LessonPart, {displayableOutput} from "./LessonPart";
import {InvalidArgument} from "../tools/Errors";

export type QuizQuestionOutput = {
    question : string,
    type : string,
    answer : {
        answerID : number,
        content : string,
        correct : boolean,
        feedback : string | undefined
    }[]
}

export type QuizQuestionInput = {
    question : string,
    type : string,
    answer : {
        content : string,
        correct : boolean,
        feedback : string | undefined
    }[]
}

export class QuizQuestion extends LessonPart {

    private readonly question : string;
    private readonly type : string;
    private readonly answers: Answer[];

    public static checkType(type : string) {
        return (type === "WrittenQuestion" || type === "SingleChoiceQuestion" || type === "MultipleChoiceQuestion")
    }

    public constructor(id : number, seqNumber : number, question : string, type : string, answers : {answerID : number, content : string, correct: boolean, feedback?: string}[]) {
        super(id, seqNumber);

        if(answers.length==0){
            throw new InvalidArgument("QuizQuestion","requires at least one answer.")
        }

        this.question = question;

        this.type = type;

        this.answers = answers.map((answer) => {
            return new Answer(answer.answerID, answer.content, answer.correct, answer.feedback)
        })
    }

    public getDisplayable(): displayableOutput {
        return {
            id : this.getID(),
            seqNumber: this.getSeqNumber(),
            output : {
                __typename : "QuizQuestionOutput",
                type : this.type,
                question : this.question,
                answer : this.answers.map((answer) => {return answer.getDisplayable()})
            }
        }
    }
}

class Answer {

    private readonly answerID : number;
    private readonly content : string;
    private readonly correct : boolean;
    private readonly feedback? : string;

    public constructor(answerID : number, content : string, correct: boolean, feedback?: string) {
        this.answerID = answerID;
        this.content = content;
        this.correct = correct;
        this.feedback = feedback;
    }

    public getDisplayable(): {
        answerID : number,
        content : string,
        correct : boolean,
        feedback : string | undefined
    } {
        return {
            answerID : this.answerID,
            content : this.content,
            correct : this.correct,
            feedback : this.feedback? this.feedback : undefined
        }
    }
}