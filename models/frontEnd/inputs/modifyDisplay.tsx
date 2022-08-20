import {Dispatch, FC, SetStateAction, useState} from "react";
import {MdModeEditOutline} from "react-icons/md";
import {ImCross} from "react-icons/im";
import styles from "../../../styles/Profile.module.css"

type args = {
    desc?: string,
    value: string,
    setProp: Dispatch<SetStateAction<string>>,
    hideOption?: boolean,
}

const ModifyDisplay: FC<args> = ({desc, value, setProp, hideOption}) => {

    const [editable, setEditable] = useState(false)

    return (
        <div className={styles.userMod}>
            {desc ? <label>{desc}</label> : ""}
            <input
                type="text"
                placeholder={value}
                disabled={!editable}
                onChange={(e) => {
                    setProp(e.target.value)
                }}
            />
            {hideOption ? "" :
                editable ?
                    <button onClick={() => {
                        setEditable(false)
                    }}><ImCross/></button>
                    :
                    <button onClick={() => {
                        setEditable(true)
                    }}><MdModeEditOutline/></button>
            }

        </div>
    )
}

export default ModifyDisplay;