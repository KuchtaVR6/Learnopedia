import {FC} from "react";
import {EmbeddableOutput} from "../../backEnd/lessonParts/Embeddable";
import Gist from "react-gist";
import styles from "../../../styles/ContentDisplay.module.css"

type args = EmbeddableOutput

const EmbeddableDisplay : FC<args> = (input) => {

    return (
        <>
            {
                input.type==="Youtube"?
                    <iframe src={`${input.uri}`} allowFullScreen className={styles.video}/>
                    :
                    input.type==="GithubGist"?
                        <div className={styles.gist}>
                            <Gist id={`${input.uri}`}/>
                        </div>

                        :
                        input.type==="ExternalImage"?
                            <div className={styles.image}>
                                <img src={`${input.uri}`} alt={`External image from `+ input.uri}/>
                            </div>
                                :
                                <>
                                </>
            }
        </>
    )
}

export default EmbeddableDisplay;