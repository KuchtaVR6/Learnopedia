import {Dispatch, FC, SetStateAction, useEffect, useRef, useState} from "react";

import prompt from "../../../styles/Prompt.module.css";
import styles from "../../../styles/Forms.module.css"
import Authenticator from "./authenticator";
import {ApolloCache, DefaultContext, gql, MutationFunctionOptions} from "@apollo/client";

type Args = {
    email: string,
    visibility: boolean,
    setVisibility: Dispatch<SetStateAction<boolean>>
    refresh: (options?: MutationFunctionOptions<any, any, DefaultContext, ApolloCache<any>> | undefined) => Promise<any>
    next?: string
    loggedIn?: boolean
}

const VerifyCode: FC<Args> = ({email, visibility, setVisibility, refresh, next, loggedIn}) => {
    const [mainClass, setMC] = useState([prompt.background, prompt.hide].join(" "));

    const [codeValue, setCodeValue] = useState("")

    const [message, setMessage] = useState("")

    const [toggle, setToggle] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    let query = gql`
        mutation Mutation($code: Int!) {
            verifyCodeUnverified(code: $code) {
                authorisation
            }
        }
    `

    if (loggedIn) {
        query = gql`
            mutation Mutation($code: Int!) {
                verifyCode(code: $code) {
                    authorisation
                }
            }
        `
    }

    useEffect(() => {
        if (visibility) {
            setMC(prompt.background)
        } else {
            setMC([prompt.background, prompt.hide].join(" "))
        }
    }, [visibility])

    useEffect(() => {
        if (codeValue.length === 5) {
            inputRef!.current!.disabled = true
            inputRef!.current!.value = ""
            setMessage("")
            setToggle(true);
        }
    }, [codeValue])

    const onFail = () => {
        setToggle(false);
        inputRef!.current!.disabled = false
        inputRef!.current!.value = ""
        setMessage("Code was incorrect 🛑")

    }

    return (
        <div className={mainClass}>
            <form onSubmit={(e) => {
                e.preventDefault()
            }} className={[styles.form, prompt.menu].join(" ")}>

                <h1>We have sent an email with your verification code to: {email}.</h1><br/>

                <label>Verification Code:</label>
                <input
                    type={"number"}
                    name={"code"}
                    className={prompt.code}
                    ref={inputRef}
                    onChange={(e) => setCodeValue(e.target.value)}
                />
                <span className={prompt.overlay}>_____</span>

                {toggle ? <Authenticator method={query} args={{
                    code: parseInt(codeValue)
                }} next={next ? next : "profile"} instantTrigger={toggle} onErrorTrigger={onFail}/> : ""}

                <br/><br/>

                If you are waiting <b>more than a minute:</b><br/>
                <button onClick={() => {
                    refresh()
                }}>Resend
                </button>
                <br/>
                <button onClick={() => {
                    setVisibility(false)
                }}>Go back
                </button>

            </form>
        </div>
    )
}

export default VerifyCode