import {FC, useEffect} from "react";
import styles from "../../../styles/RegPage.module.css";
import {FullOutput, MetaOutput} from "../../backEnd/contents/Content";
import NavigationTile from "./navigationTile";
import {gql, useQuery} from "@apollo/client";

const CourseMenu: FC<{ navigation?: FullOutput, inline?: boolean }> = ({navigation, inline}) => {

    const recommendationQuery = gql`
        query GetRecommended {
            getRecommended {
                id
                name
                description
                keywords {
                    ID
                    Score
                    word
                }
                type
                seqNumber
                creation
                modification
                authors
            }
        }`

    const {loading, error, data} = useQuery(recommendationQuery);

    let keyCounter = 0;

    return (
        <div className={inline ? styles.courseMenuInline : styles.courseMenuMain}>
            {navigation ?
                <>
                    <hr/>
                    <NavigationTile meta={navigation.metas.meta}/>
                    <hr/>
                    {
                        navigation.metas.chapters.map((chapter) => {
                            let x = chapter.lessons.map((lesson) => {
                                return <NavigationTile key={lesson.id} meta={lesson}/>
                            })
                            keyCounter += 1;
                            return (
                                <div key={keyCounter}>
                                    <NavigationTile key={chapter.meta.id} meta={chapter.meta}/>
                                    <hr/>
                                    {x}
                                    {x.length > 0 ? <hr/> : ""}
                                </div>
                            )
                        })
                    }
                    <hr/>
                </>
                : ""}
            <h3>Popular Content:</h3>
            <hr/>
            {
                data ?
                    data.getRecommended.map((row : MetaOutput) => {
                        keyCounter+=1;
                        return(
                            <div key={keyCounter}>
                                <NavigationTile meta={row} treatEqually={true}/>
                                <hr/>
                            </div>
                        )
                    })
                    :
                    "Loading"
            }
        </div>
    )
}

export default CourseMenu;