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
            className={treatEqually || meta.type == 1 ? styles.addPadding : meta.type == 2 ? styles.addExtraPadding : styles.noPadding}>
            <Link href={"/view/" + meta.id}>
                {meta.name}
            </Link>
        </div>

    )
}

export default NavigationTile;