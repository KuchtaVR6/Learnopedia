import {FC} from "react";
import styles from "../../../styles/RegPage.module.css";

const KeywordDisplay: FC<{ keywords: { ID: number, Score: number, word: string }[] }> = ({keywords}) => {
    return (
        <>
            Keywords: &nbsp;
            {
                keywords.map((keyword) => {
                    return (
                        <span key={keyword.ID} className={styles.keyword}>
                            {keyword.word}
                        </span>
                    )
                })
            }
        </>
    )
}

export default KeywordDisplay;