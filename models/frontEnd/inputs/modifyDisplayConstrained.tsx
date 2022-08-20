import {Dispatch, FC, SetStateAction, useState} from "react";
import {MdModeEditOutline} from "react-icons/md";
import {ImCross} from "react-icons/im";
import styles from "../../../styles/Profile.module.css"
import SelfValidatingInput from "./selfValidatingInput";
import {gql} from "@apollo/client";

type args = {
    desc?: string,
    value: string,
    setProp: Dispatch<SetStateAction<string>>,
    type : ConstrainedInputTypes,
    hideOptions? : boolean,
}

const ModifyDisplayConstrained: FC<args> = ({desc, value, setProp, type, hideOptions}) => {

    const [editable, setEditable] = useState(false)

    let checkQuery;

    if(type === ConstrainedInputTypes.NICKNAME)
    {
        checkQuery = gql`
            query Nickname($query : String!)
            {
                vacantNickname(nickname: $query) {
                    continue
                }
            }
        `
    }
    else if(type === ConstrainedInputTypes.EMAIL)
    {
        checkQuery = gql`
            query Email($query : String!)
            {
                vacantEmail(email: $query) {
                    continue
                }
            }
        `
    }
    else{
        return <>ERROR!</>
    }

    return (
        <div className={styles.userMod}>
            {desc? <label>{desc}</label> : ""}
            <SelfValidatingInput
                type={type}
                query={checkQuery}
                setProp={setProp}
                disable={!editable}
                placeholder={value}
            />
            {hideOptions? "" : editable ?
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

export enum ConstrainedInputTypes{
    EMAIL,
    NICKNAME
}

export default ModifyDisplayConstrained;