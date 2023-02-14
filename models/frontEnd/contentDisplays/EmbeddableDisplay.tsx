import {FC} from "react";
import {EmbeddableOutput} from "../../backEnd/lessonParts/Embeddable";
import Gist from "react-gist";
import styles from "../../../styles/ContentDisplay.module.css"
import NoStretchImage from "./noStretchImage";

type args = EmbeddableOutput

const EmbeddableDisplay : FC<args> = (input) => {

    return (
        <>
            {
                input.type==="Youtube"?
                    <iframe title={`An embedded video available at ${input.uri}`} src={`${input.uri}`} allowFullScreen className={styles.video}/>
                    :
                    input.type==="GithubGist"?
                        <div className={styles.gist}>
                            <Gist id={`${input.uri}`}/>
                        </div>

                        :
                        input.type==="Image"?
                            <NoStretchImage uri={input.uri} />
                                :
                                <>
                                </>
            }
        </>
    )
}

export default EmbeddableDisplay;