import {Dispatch, FC, SetStateAction, useEffect, useState} from "react";
import {DocumentNode, useLazyQuery} from "@apollo/client";
import styles from "../../styles/Forms.module.css";
import {ConstrainedInputTypes} from "./modifyDisplayConstrained";
import OnStopInput, {OSIStates} from "./OnStopInput";

type Args = {
    setProp: Dispatch<SetStateAction<string>>,
    query: DocumentNode,
    type: ConstrainedInputTypes,
    disable?: boolean
    placeholder?: string
    autoComplete?: string
}

const SelfValidatingInput: FC<Args> = ({setProp, query, type, disable, placeholder}) => {

    const [internal, setInternal] = useState("")
    const [message, setMessage] = useState("Must be unique 🤔")
    const [valid, setValid] = useState(false)

    const [inputState, setInputState] = useState(OSIStates.INSUFFICIENT_LETTERS)

    const [validate, {loading, error, data}] = useLazyQuery(query);

    const checkData = () => {
        if (data) {
            if (data.vacantEmail) {
                if (data.vacantEmail.continue) {
                    setProp(internal)
                    setMessage("Great choice! 😎")
                    setValid(true)
                } else {
                    setMessage("Taken... 😞")
                }
            }
            if (data.vacantNickname) {
                if (data.vacantNickname.continue) {
                    setProp(internal)
                    setMessage("Great choice! 😎")
                    setValid(true)
                } else {
                    setMessage("Taken... 😞")
                }
            }
        }
    }

    let basicValidator;

    if(type === ConstrainedInputTypes.EMAIL)
    {
        basicValidator = (query : string) => {
            return !(query.indexOf("@") >= query.length - 1 || query.indexOf("@") < 0)
        }
    }
    else if(type === ConstrainedInputTypes.NICKNAME)
    {
        basicValidator = (query : string) => {
            return !(query.indexOf("@") >= 0)
        }
    }

    const checkChange = (newInput: string) => {
        if (newInput.length > 3) {
            if (type === ConstrainedInputTypes.EMAIL && (newInput.indexOf("@") >= newInput.length - 1 || newInput.indexOf("@") < 0)) {
                setMessage("Are you sure it's an email? 📧")
            } else if (type === ConstrainedInputTypes.NICKNAME && newInput.indexOf("@") >= 0) {
                setMessage("No @ signs allowed in nicknames 📧")
            } else {
                setInternal(newInput);
                setMessage("Checking... 🤖")
                validate({variables: {query: newInput}});
                checkData()
            }
        } else {
            setMessage("Needs at least 4 letters 📏")
        }
    }

    useEffect(() => {
        checkData()
    }, [data])

    useEffect(() => {
        switch (inputState)
        {
            case OSIStates.INSUFFICIENT_LETTERS:
                setMessage("Needs at least 4 letters 📏")
                break;
            case OSIStates.REGISTERING:
                setMessage("Listening... ⌨")
                break;
            case OSIStates.INVALID_INPUT:
                if(type === ConstrainedInputTypes.EMAIL)
                {
                    setMessage("Are you sure it's an email? 📧")
                }
                else{
                    setMessage("No @ signs allowed in nicknames 📧")
                }
            case OSIStates.EVALUATING:
                setMessage("Checking... 🤖")
                break;
            case OSIStates.ON_COOL_DOWN:
                setMessage("Give me a second I can't keep-up 🥴")
                break;

        }
    },[inputState])

    /**
     *
     *             <input
     *                 className={valid ? "" : "invalid"}
     *                 required={true}
     *                 type={type === ConstrainedInputTypes.EMAIL ? "email" : "text"}
     *                 autoComplete={type === ConstrainedInputTypes.EMAIL ? "email" : "username"}
     *                 disabled={disable}
     *                 placeholder={placeholder}
     *
     *                 onChange={(e) => {
     *                     setValid(false)
     *                     setProp("");
     *                     setModified(true)
     *                     if (e.target.value.length > 3) {
     *                         setMessage("Click away and I will check... 🤖")
     *                     } else {
     *                         setMessage("Needs at least 4 letters 📏")
     *                     }
     *                 }}
     *
     *                 onBlur={(e) => {
     *                     checkChange(e.target.value)
     *                 }}
     *             />
     *
     */

    return (
        <div>
            <OnStopInput
                className={valid ? "" : "invalid"}
                required={true}
                type={type === ConstrainedInputTypes.EMAIL ? "email" : "text"}
                autoComplete={type === ConstrainedInputTypes.EMAIL ? "email" : "username"}
                disabled={disable}
                placeholder={placeholder}
                evaluate={checkChange}
                minLetters={4}
                coolDown={5000}
                setCurrentState={setInputState}
                basicValidator={basicValidator}
            />
            <br/>
            {disable ? "" : <span className={styles.waring}>{message}</span>}
        </div>
    )
}

export default SelfValidatingInput;