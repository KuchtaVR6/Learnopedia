import {FC} from "react";
import {MetaOutput} from "../backEnd/contents/Content";
import Link from "next/link";
import styles from '../../styles/RegPage.module.css'
import {useRouter} from "next/router";

type args = {
    meta: MetaOutput
}

const NavigationTile: FC<args> = ({meta}) => {
    let router = useRouter();

    return (
        <div className={meta.type==1? styles.addPadding : meta.type==2? styles.addExtraPadding : ""}>
            <button onClick={() => {router.push("/view/"+meta.id)}} className={styles.navigationContainer}>
                    <h2>{meta.name}</h2>
            </button>
        </div>

    )
}

export default NavigationTile;