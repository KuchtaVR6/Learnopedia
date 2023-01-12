import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";
import {FC} from "react";
import EditButton from "../inputs/editButton";
import styles from "../../../styles/ContentDisplay.module.css"

type args = {
    row : displayableOutput,
    loggedIn : boolean,
    id? : number
}

const LessonPartDisplay : FC<args> = ({row, loggedIn, id}) => {
    return (
        <div key={row.id} className={styles.lessonPart} style={{width: "100%", wordBreak: "break-all"}}>
            {id !== undefined? <EditButton loggedIn={loggedIn} label={"Edit a part"}
                                           path={"/edit/lessonpart/" + id + "?child=" + row.id}/> : ""}
            <b>
                {row.output.basicText}
            </b> <br/>
            {row.output.advancedText}

            <br/>
        </div>
    )
}

export default LessonPartDisplay;