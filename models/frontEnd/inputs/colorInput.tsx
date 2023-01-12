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

const ColorInput: FC<args> = ({desc, value, setProp, hideOption}) => {

    const [editable, setEditable] = useState(false)

    const [placeholder, setPlaceholder] = useState(value)

    return (
        <div className={styles.userMod} style={{display: hideOption? "none" : "inherit"}}>
            {desc ? <label>{desc}</label> : ""}
            <input
                type="color"
                value={placeholder}
                disabled={!editable}
                onChange={(e) => {
                    setPlaceholder(e.target.value)
                    setProp(e.target.value)
                }}
                style={{height: "2.5em"}}
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

export default ColorInput;