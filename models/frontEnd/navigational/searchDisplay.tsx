import {FC} from "react";
import {MetaOutput} from "../../backEnd/contents/Content";
import KeywordDisplay from "../keywordCompoments/keywordDisplay";
import {useRouter} from "next/router";
import styles from "../../../styles/ContentDisplay.module.css";

type args = {
    array: {
        score: number,
        content: MetaOutput,
    }[]
    query: string
}

const SearchDisplay: FC<args> = ({array, query}) => {

    let router = useRouter()

    let keyCounter = 0;

    return (
        <div className={styles.main}>
            {array.length == 0 ?
                <>
                    <h2> No results for: {query} </h2>
                    <p> Check spelling or rephrase your query </p>
                </>
                :
                <h2>Results for: {query}</h2>
            }

            {
                array.map(({content}) => {
                    keyCounter += 1;
                    return (
                        <div key={keyCounter}>
                            <hr/>
                            <i>{content.type === 0 ? "Course" : content.type === 1 ? "Chapter" : "Lesson"}</i>
                            <br/>
                            <button className={styles.hideButton} onClick={() => {
                                router.push("/view/" + content.id)
                            }}><h5>{content.name}</h5></button>
                            <p className={styles.details}>
                                {content.authors}<br/>
                                Last Modified: {content.modification}<br/>
                                Created: {content.creation}<br/>
                                <KeywordDisplay keywords={content.keywords}/>
                            </p>
                            {content.description}<br/>
                        </div>
                    )
                })
            }

        </div>
    )
}

export default SearchDisplay;