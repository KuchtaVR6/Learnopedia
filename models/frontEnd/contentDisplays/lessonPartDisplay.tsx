import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";
import {FC} from "react";
import EditButton from "../inputs/editButton";
import styles from "../../../styles/ContentDisplay.module.css"
import EmbeddableDisplay from "./EmbeddableDisplay";
import QuizQuestionDisplay from "./QuizQuestionDisplay";
import ParagraphDisplay from "./ParagraphDisplay";

type args = {
    row: displayableOutput,
    loggedIn: boolean,
    id?: number
}

const LessonPartDisplay: FC<args> = ({row, loggedIn, id}) => {

    return (
        <div key={row.id} className={styles.lessonPart} style={{width: "100%", wordBreak: "break-word"}}>
            {id !== undefined ? <EditButton loggedIn={loggedIn} label={"Edit a part"}
                                            path={"/edit/lessonpart/" + id + "?child=" + row.id}
                                            removeText={true}/> : ""}
            {
                row.output.__typename === "ParagraphOutput" ?

                    <ParagraphDisplay basicText={row.output.basicText} advancedText={row.output.advancedText}/>
                    :
                    row.output.__typename === "EmbeddableOutput" ?

                        <EmbeddableDisplay type={row.output.type} uri={row.output.uri}/>

                        :

                        row.output.__typename === "QuizQuestionOutput" ?

                            <QuizQuestionDisplay question={row.output.question} type={row.output.type}
                                                 answer={row.output.answer}/>

                            :

                            <></>
            }

            <br/>
        </div>
    )
}

export default LessonPartDisplay;