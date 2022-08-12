import {FC} from "react";
import styles from "../../styles/ContentDisplay.module.css";
import {AiTwotoneEdit} from "react-icons/ai";
import {useRouter} from "next/router";
import Link from "next/link";

type args = {
    loggedIn : boolean,
    label : string,
    path : string
}

const EditButton: FC<args> = ({loggedIn, label, path}) => {
    const router = useRouter()

    return (
        <div style={{float : "right"}}>
            <button className={styles.modifyButton} disabled={!loggedIn} onClick={() =>{if(loggedIn){router.push(path)} else {router.push("/login")}}}>
                <AiTwotoneEdit/> {loggedIn? label : "Log in to edit"}
            </button>
        </div>

    )
}

export default EditButton;