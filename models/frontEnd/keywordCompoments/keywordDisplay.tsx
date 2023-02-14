import {FC} from "react";
import styles from "../../../styles/RegPage.module.css";

const KeywordDisplay: FC<{ keywords: { ID: number, Score: number, word: string }[] }> = ({keywords}) => {
    return (
        <div style={{overflowWrap: "break-word"}}>
            Keywords: &nbsp;
            {
                keywords.map((keyword) => {
                    return (
                        <>
                            <span key={keyword.ID} className={styles.keyword}>
                            {keyword.word}
                            </span>
                            {" "}
                        </>

                    )
                })
            }
        </div>
    )
}

export default KeywordDisplay;