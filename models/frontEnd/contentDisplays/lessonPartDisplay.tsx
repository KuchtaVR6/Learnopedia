import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";
import {FC} from "react";
import EditButton from "../inputs/editButton";
import styles from "../../../styles/ContentDisplay.module.css"
import EmbeddableDisplay from "./EmbeddableDisplay";
import QuizQuestionDisplay from "./QuizQuestionDisplay";

type args = {
    row: displayableOutput,
    loggedIn: boolean,
    id?: number
}

const LessonPartDisplay: FC<args> = ({row, loggedIn, id}) => {

    return (
        <div key={row.id} className={styles.lessonPart} style={{width: "100%", wordBreak: "break-all"}}>
            {id !== undefined ? <EditButton loggedIn={loggedIn} label={"Edit a part"}
                                            path={"/edit/lessonpart/" + id + "?child=" + row.id} removeText={true}/> : ""}
            {
                row.output.__typename === "ParagraphOutput" ?

                    <>
                        {row.output.advancedText? <><br/><h3>{row.output.advancedText}</h3></> : ""}
                        <span style={{fontSize: "110%"}}>
                            {(row.output.basicText.indexOf("https://") >= 0 && row.output.basicText.indexOf("|") >= 0) ?
                                row.output.basicText.split("|").map((part) => {
                                    let split = part.split("~")
                                    if (split[0].indexOf("https://") >= 0 && split.length===2)
                                        return <a
                                            href={split[0]}
                                            onClick={()=>{window.alert("Redirecting to an external link: "+split[0])}}
                                        >
                                            {split[1]}
                                        </a>
                                    else
                                        return part
                                })
                                :
                                row.output.basicText
                            }
                        </span>
                    </>

                    :

                    row.output.__typename === "EmbeddableOutput" ?

                        <EmbeddableDisplay type={row.output.type} uri={row.output.uri}/>

                        :

                        row.output.__typename === "QuizQuestionOutput" ?

                            <QuizQuestionDisplay question={row.output.question} type={row.output.type} answer={row.output.answer}/>

                            :

                    <></>
            }

            <br/>
        </div>
    )
}

export default LessonPartDisplay;