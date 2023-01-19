import {EmbeddableInput} from "./Embeddable";
import {QuizQuestionInput} from "./QuizQuestion";
import {ParagraphInput} from "./LessonPartManager";

export type lessonPartArgs = {
    type : lessonPartTypes.PARAGRAPH,
    content : ParagraphInput
} | {
    type : lessonPartTypes.EMBEDDABLE,
    content : EmbeddableInput
} | {
    type : lessonPartTypes.QUIZ_QUESTION,
    content : QuizQuestionInput
}

export enum lessonPartTypes {
    PARAGRAPH,
    EMBEDDABLE,
    QUIZ_QUESTION
}