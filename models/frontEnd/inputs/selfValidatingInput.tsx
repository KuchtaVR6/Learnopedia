import {Dispatch, FC, SetStateAction, useEffect, useRef, useState} from "react";
import {DocumentNode, useLazyQuery} from "@apollo/client";
import styles from "../../../styles/Forms.module.css";
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

    const [validateInner, {loading, error, data}] = useLazyQuery(query);
    const prevChecks = useRef(new Map<String, boolean>);
    const prevSend = useRef<string>("")

    const validate = (input : String, ver : number) => {
        if (ver)
        {
            if (ver > verMax.current)
            {
                verMax.current = ver
            }
            else if (ver < verMax.current)
            {
                // stale request, will be ignored
                return;
            }
        }

        if(prevChecks.current.has(input))
        {
            if (prevChecks.current.get(input)) {
                setProp(internal)
                setCurrentState(OSIStates.ACCEPTED, ver)
                setValid(true)
            } else {
                setCurrentState(OSIStates.TAKEN, ver)
            }
        }
        else{
            validateInner({variables: {query: input}})
        }
    }

    const checkData = () => {
        if (data) {
            if (data.vacantEmail) {
                if (data.vacantEmail.query == internal) {
                    if (data.vacantEmail.vacant) {
                        setProp(internal)
                        setMessage("Great choice! 😎")

                        setValid(true)
                    } else {
                        setMessage("Taken... 😞")
                    }
                }
                prevChecks.current.set(data.vacantEmail.query,data.vacantEmail.vacant)
            }
            if (data.vacantNickname) {
                if (data.vacantNickname.query == internal) {
                    if (data.vacantNickname.vacant) {
                        setProp(internal)
                        setMessage("Great choice! 😎")
                        setValid(true)
                    } else {
                        setMessage("Taken... 😞")
                    }
                }
                prevChecks.current.set(data.vacantNickname.query,data.vacantNickname.vacant)
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

    const checkChange = (newInput: string, ver : number) => {

        if(internal === newInput){
            if(valid){
                setCurrentState(OSIStates.ACCEPTED, ver)
            }
            else{
                setCurrentState(OSIStates.TAKEN, ver)
            }
            return;
        }

        if (ver)
        {
            if (ver > verMax.current)
            {
                verMax.current = ver
            }
            // better to accept a stale request than confuse the user
            // if its stale, and it makes it through:  it will be discarded in the next stage
        }

        if (newInput.length > 3) {

            if (type === ConstrainedInputTypes.EMAIL && (newInput.indexOf("@") >= newInput.length - 1 || newInput.indexOf("@") < 0)) {
                setCurrentState(OSIStates.INVALID_INPUT,ver)
            } else if (type === ConstrainedInputTypes.NICKNAME && newInput.indexOf("@") >= 0) {
                setCurrentState(OSIStates.INVALID_INPUT, ver)
            } else {
                if(prevSend.current !== newInput) {
                    setInternal(newInput);
                    prevSend.current = newInput;
                    setCurrentState(OSIStates.EVALUATING, ver)
                    validate(newInput, ver);
                }
                else{
                    if(valid){
                        setCurrentState(OSIStates.ACCEPTED, ver)
                    }
                    else{
                        setCurrentState(OSIStates.TAKEN, ver)
                    }
                }
            }
        } else {
            setCurrentState(OSIStates.INSUFFICIENT_LETTERS, ver)
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
                break;
            case OSIStates.EVALUATING:
                setMessage("Checking... 🤖")
                break;
            case OSIStates.ON_COOL_DOWN:
                setMessage("Give me a second I can't keep-up 🥴")
                break;
            case OSIStates.TAKEN:
                setMessage("Taken... 😞")
                break;
            case OSIStates.ACCEPTED:
                setMessage("Great choice! 😎")
                break;

        }
    },[inputState])

    let verMax = useRef(0);

    const setCurrentState = (inputRegistered : OSIStates, ver : number) => {
        if (ver)
        {
            if (ver > verMax.current)
            {
                verMax.current = ver
            }
            else if (ver < verMax.current)
            {
                // stale request, will be ignored
                return;
            }
        }
        setInputState(inputRegistered)
    }

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
                setCurrentState={setCurrentState}
                basicValidator={basicValidator}
                OnChange={()=>{setProp("")}}
            />
            <br/>
            {disable ? "" : <span className={styles.waring}>{message}</span>}
        </div>
    )
}

export default SelfValidatingInput;