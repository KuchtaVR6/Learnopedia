import {FC} from "react";
import styles from "../../styles/RegPage.module.css";
import {FullOutput} from "../backEnd/contents/Content";
import NavigationTile from "./navigationTile";

const courseMenu: FC<{ navigation?: FullOutput, inline? : boolean }> = ({navigation,inline}) => {
    if (navigation) {
        let keyCounter = 0;

        return (
            <div className={inline? styles.courseMenuInline : styles.courseMenuMain}>
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
                                {x.length>0? <hr/> : ""}
                            </div>
                        )
                    })
                }
            </div>
        )
    }
    return (
        <div className={styles.courseMenuMain}>
        </div>
    )
}

export default courseMenu;