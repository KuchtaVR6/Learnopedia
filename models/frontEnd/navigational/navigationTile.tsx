import {FC} from "react";
import {MetaOutput} from "../../backEnd/contents/Content";
import Link from "next/link";
import styles from '../../../styles/RegPage.module.css'

type args = {
    meta: MetaOutput
    treatEqually?: boolean
}

const NavigationTile: FC<args> = ({meta, treatEqually}) => {
    return (
        <div
            className={treatEqually || meta.type == 1 ? styles.addPadding : meta.type == 2 ? styles.addExtraPadding : ""}>
            <Link href={"/view/" + meta.id}>
                <div className={styles.navigationContainer}>
                    {meta.name}
                </div>
            </Link>
        </div>

    )
}

export default NavigationTile;