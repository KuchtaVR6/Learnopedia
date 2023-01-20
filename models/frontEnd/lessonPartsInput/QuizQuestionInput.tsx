import {Dispatch, FC, SetStateAction, useEffect, useState} from "react";
import {lessonPartArgs, lessonPartTypes} from "../../backEnd/lessonParts/LessonPartTypes";
import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";
import EvaluatorInput from "../inputs/evaluatorInput";
import {AiFillDelete} from "react-icons/ai";

type args = {
    setChanges: Dispatch<SetStateAction<lessonPartArgs | null>>,
    current?: displayableOutput
}

const QuizQuestionInput: FC<args> = (props) => {

    const QuestionValidator = (question: string) => {
        if (question.length < 6) {
            setQuestion("")
            throw new Error("Your question is too short 📏 (min 6 chars)")
        }
    }

    const ContentValidator = (content: string) => {
        if (content.length < 1) {
            setQuestion("")
            throw new Error("Your question is too short 📏 (min 1 chars)")
        }

        for (let ans of answers) {
            if (ans.content.toLowerCase() === content.toLowerCase()) {
                throw new Error("Answer already defined")
            }
        }
    }

    const [question, setQuestion] = useState<string>(props.current?.output.__typename === "QuizQuestionOutput" ? props.current.output.question : "")
    const [type, setType] = useState<string>(props.current?.output.__typename === "QuizQuestionOutput" ? props.current?.output.type : "SingleChoiceQuestion")
    const [answers, setAnswers] = useState<{
        content: string,
        correct: boolean,
        feedback: string | undefined
    }[]>(props.current?.output.__typename === "QuizQuestionOutput" ? props.current.output.answer : [])

    const [currentContent, setCurrentContent] = useState<string>("")
    const [currentCorrect, setCurrentCorrect] = useState<boolean>(true)
    const [currentFeedback, setCurrentFeedback] = useState<string>("")

    const [answersChanged, setAnswersChanged] = useState<boolean>(false)

    const [clearCurrent, setClearCurrents] = useState<boolean>(false)

    useEffect(() => {
            if (question.length > 0 && type.length > 0 && answers.length > 0 &&
                (!props.current || (props.current.output.__typename === "QuizQuestionOutput" &&
                    (question !== props.current.output.question || type !== props.current.output.type || answersChanged)))) {
                props.setChanges({
                    type : lessonPartTypes.QUIZ_QUESTION,
                    content : {
                        question : question,
                        type : type,
                        answer : answers
                    }
                })
            }
            else {
                props.setChanges(null)
            }
        }
        ,
        [question, type, answers])

    return (
        <div>
            <b>Input the question:</b><br/>
            <EvaluatorInput condition={QuestionValidator} setInput={setQuestion}
                            value={props.current?.output.__typename === "QuizQuestionOutput" ? props.current.output.question : ""}
                            width={103}/>
            <b>Select the question type</b><br/>
            <select name="type" onChange={(e) => {
                setType(e.target.value)
            }}>
                <option value="SingleChoiceQuestion"
                        selected={props.current?.output.__typename === "QuizQuestionOutput" ? props.current?.output.type === "SingleChoiceQuestion" : false}>
                    SingleChoiceQuestion - A closed-ended question where only one answer is correct. (A,B,C,D) select
                    one
                </option>
                <option value="MultipleChoiceQuestion"
                        selected={props.current?.output.__typename === "QuizQuestionOutput" ? props.current?.output.type === "MultipleChoiceQuestion" : false}>
                    MultipleChoiceQuestion - A closed-ended question where one or more answers are correct. (A,B,C,D)
                    select one or more
                </option>
                <option value="WrittenQuestion"
                        selected={props.current?.output.__typename === "QuizQuestionOutput" ? props.current?.output.type === "WrittenQuestion" : false}>
                    WrittenQuestion - Question where the user types in the answer.
                </option>
            </select>
            <br/><br/>
            <b>Answers:</b><br/>
            {
                answers.map((row, key) => {
                    return <button key={key} onClick={() => {
                        setAnswers(answers.filter((thisRow) => {
                            return thisRow !== row
                        }));
                        setAnswersChanged(true);
                    }}>
                        <AiFillDelete/> {row.content}
                        <i>is</i> {row.correct ? "correct" : "incorrect"} {row.feedback ? <><i>and the feedback
                        is:</i> {row.feedback}</> : ""}
                    </button>
                })
            }<br/><br/>
            <b>Add an answer:</b><br/>
            Content:
            <EvaluatorInput condition={ContentValidator} setInput={setCurrentContent}
                            width={50} clear={clearCurrent}/>
            Correct:
            <select name="correct" onChange={(e) => {
                if (e.target.value === "yes") {
                    setCurrentCorrect(true)
                } else {
                    setCurrentCorrect(false)
                }
            }}>
                <option value={"yes"}>
                    yes
                </option>
                <option value={"no"}>
                    no
                </option>
            </select><br/><br/>
            Feedback (optional):
            <EvaluatorInput condition={() => {
            }} setInput={setCurrentFeedback}
                            width={50} clear={clearCurrent}/>

            <button onClick={() => {
                if (currentContent.length > 0) {
                    setAnswers([...answers, {
                        content: currentContent,
                        correct: currentCorrect,
                        feedback: currentFeedback.length > 0 ? currentFeedback : undefined
                    }])
                    setClearCurrents(true)
                    setTimeout(() => {
                        setClearCurrents(false)
                    }, 20)
                    setAnswersChanged(true);
                }
            }} disabled={currentContent.length < 1}>Add Answer
            </button>

            <br/>
            <br/>

            Question {question.length > 0 ? (!props.current || (props.current.output.__typename !== "QuizQuestionOutput" || question !== props.current.output.question)) ? "✔" : "📕" : "❌"}<br/>
            Type {type.length > 0 ? (!props.current || (props.current.output.__typename !== "QuizQuestionOutput" || type !== props.current.output.type)) ? "✔" : "📕" : "❌"}<br/>
            Answers {answers.length > 0 ? (!props.current || answersChanged) ? "✔" : "📕" : "❌ (at least one answer is needed)"}
        </div>
    )
}

export default QuizQuestionInput;