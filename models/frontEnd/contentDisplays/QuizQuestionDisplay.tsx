import {FC, useState} from "react";
import {QuizQuestionOutput} from "../../backEnd/lessonParts/QuizQuestion";
import {RxCheck, RxCross1} from "react-icons/rx";


type args = QuizQuestionOutput

const QuizQuestionDisplay: FC<args> = (input) => {

    const [submitted, setSubmitted] = useState(false)

    const [answersSelected, setAnswerSelected] = useState<number[]>([])

    const [writtenAnswer, setWrittenAnswer] = useState("")

    const [endDisplay, setEndDisplay] = useState("")

    const select = (answerID: number) => {

        if (answersSelected.indexOf(answerID) >= 0) {
            setAnswerSelected(answersSelected.filter((ans) => {
                return ans !== answerID
            }))
        }
        else {
            if(input.type==="SingleChoiceQuestion") {
                setAnswerSelected([answerID])
            }
            else {
                setAnswerSelected([...answersSelected,  answerID])
            }
        }
    }

    const check = () => {
        setSubmitted(true)

        let selected = input.answer.filter((row) => {
            return (answersSelected.indexOf(row.answerID) >= 0 || writtenAnswer.toLowerCase() === row.content.toLowerCase())
        })

        let outOf = 1;

        if(input.type==="MultipleChoiceQuestion") {
            outOf = input.answer.filter((row) => {
                return row.correct
            }).length
        }

        let score = selected.filter((row) => {return row.correct}).length - selected.filter((row) => {return !row.correct}).length

        if(score<0){
            score = 0;
        }

        let possibleAnswers = ".";

        let finalFeedback = "";

        if(input.type==="WrittenQuestion") {
            if(score===0) {
                possibleAnswers = ".\nAccepted answers: " + input.answer.map((row) => {
                    if (row.correct)
                        return row.content
                    return ""
                }).join("; ")
            }
            finalFeedback = (selected[0]?.feedback)? (selected[0]?.feedback) + ".\n" : ""
        }

        let op;

        if(score===0) {
            op = "Incorrect 😔"
        }
        else if (score===outOf) {
            op = "Correct! 😃"
        }
        else {
            op = "Partially correct 😐"
        }

        setEndDisplay( finalFeedback + op + ", you have scored " + score + " out of " + outOf + possibleAnswers)
    }

    return (
        <>
            <hr/>

            <b>{input.question}</b> <br/>
            <i style={{opacity: "60%"}}>{input.type === "SingleChoiceQuestion" ? "Select one." : input.type==="WrittenQuestion" ?  "Write your answer below. " : "Select all that apply."}</i>
            {
                input.type==="WrittenQuestion" ?
                    "" :
                    <i style={{opacity: "60%", display: submitted? "inherit" : "none", fontSize: "80%"}}>
                        Tick means this answer was correctly selected or not selected.
                        A cross means the selection was incorrect or the answer should have been selected.
                    </i>
            }

            {
                input.type === "WrittenQuestion" ?

                    <>
                        <br/>
                        <input type={"text"} onChange={(e) => {setWrittenAnswer(e.target.value)}}/>
                        <br/>
                    </>


                    :

                    <>
                        {
                            input.answer.map((each, key) => {
                                return (<div key={key}>
                                    <input type={"checkbox"} id={`${each.answerID}`} disabled={submitted} checked={answersSelected.indexOf(each.answerID)>=0} onChange={() => {select(each.answerID)}}/>
                                    <label htmlFor={`${each.answerID}`}>&nbsp;{each.content}
                                        <span style={{display: submitted ? "inherit" : "none"}}>
                                            {answersSelected.indexOf(each.answerID)>=0? each.correct? <RxCheck/> : <RxCross1/> : each.correct? <RxCross1/> : <RxCheck/>}
                                            <i>&nbsp;{each.feedback}</i> </span>
                                    </label>
                                </div>)
                            })
                        }
                    </>
            }
            <button disabled={(answersSelected.length===0 && writtenAnswer.length===0) || submitted} onClick={check}>Check 🧐</button>

            <br/>

            {endDisplay}

            <hr/>
        </>
    )
}

export default QuizQuestionDisplay;