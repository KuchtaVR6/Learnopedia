import {Dispatch, FC, SetStateAction, useState} from "react";
import styles from "../../../styles/Forms.module.css";

type Args = {
    setProp: Dispatch<SetStateAction<string>>,
}

const PasswordValidator: FC<Args> = ({setProp}) => {

    const [message, setMessage] = useState("Must be strong 💪")
    const [valid, setValid] = useState(false)

    const evaluate = (proposal: string) => {
        if (proposal.length < 8) {
            setMessage("At least 8 characters 📏")
        } else if (proposal.length > 12) {
            setMessage("The password is too long! 💩")
        } else if (proposal.toLowerCase() === proposal || proposal.toUpperCase() === proposal) {
            setMessage("Please mix letter cases 🔠🔡")
        } else if (!/[0-9]/.test(proposal)) {
            setMessage("You need to include a number 💯")
        } else if (!/[a-z]/i.test(proposal)) {
            setMessage("You need to include letters ©")
        } else {
            setValid(true)
            setMessage("Awesome! 😄")
            setProp(proposal)
        }
    }

    return (
        <div>
            <input
                name={"password"}
                id={"password"}
                className={valid ? "" : "invalid"}
                required={true}
                type={"password"}
                autoComplete={"password-new"}
                onChange={(e) => {
                    setValid(false)
                    setProp("");
                    evaluate(e.target.value)
                }}
            /><br/>
            <span className={styles.waring}>{message}</span>
        </div>
    )
}

export default PasswordValidator;