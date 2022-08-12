import {NextPage} from "next";
import styles from "../styles/Forms.module.css";
import Image from "next/image";
import logo from "../public/images/logo.png";
import Link from "next/link";
import VerifyCode from "../models/frontEnd/verifyCode";
import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/router";
import {gql, useMutation} from "@apollo/client";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const Forgot: NextPage = () => {

    const [email, setEmail] = useState("");

    const [captchaToken, setCaptchaToken] = useState("");

    const [allValid, setAllValid] = useState(false)

    const [visibility, setVisibility] = useState(false)
    const emailRef = useRef<HTMLInputElement>(null)

    const [message, setMessage] = useState("");

    const router = useRouter()

    useEffect(() => {
        if ((email.indexOf("@") >= email.length - 1 || email.indexOf("@") < 0) || !captchaToken) {
            setAllValid(false)
        } else {
            setAllValid(true)
        }
    }, [email,captchaToken])

    const forgot = gql`
        mutation Mutation($email: String!, $captchaToken: String!) {
            forgotPassword(email: $email, captchaToken: $captchaToken) {
                continue
            }
        }
    `

    const [sendEmail, {loading, error, data}] = useMutation(forgot, {
        variables: {
            email: email,
            captchaToken: captchaToken
        }
    });

    const reg = () => {
        if (allValid) {
            sendEmail().then((e) => {
                setVisibility(true)
                setMessage("")
            }).catch(() => {
                emailRef!.current!.value = ""
                setVisibility(false)
                setMessage("Make sure you type-in the email correctly")
            })
        }
    }

    return (
        <div>
            <div className={visibility ? [styles.page, styles.hide].join(" ") : styles.page}>
                <form className={styles.form} onSubmit={(e) => {
                    e.preventDefault()
                }}>

                    <div className={styles.logoContainer}>
                        <Image src={logo} alt="Learnopedia Logo"/>
                    </div>

                    <br/>
                    <br/>

                    <h1>No password? No problem!</h1>
                    <br/>
                    Actually I do remember 😅<Link href={"/login"}>Login</Link><br/>
                    <div className={styles.field}>

                        <label>Email:</label> <br/>
                        <input
                            required={true}
                            type={"email"}
                            name={"email"}
                            id={"email"}
                            ref={emailRef}
                            autoComplete={"email"}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                    </div>

                    <br/>

                    <HCaptcha
                        sitekey={process.env.NODE_ENV==="production"? process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY! : process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY_TEST!}
                        onVerify={(token) => setCaptchaToken(token)}
                    />

                    <br/>

                    <button disabled={!allValid} onClick={(e) => {
                        reg()
                    }}>Reset {allValid ? "✔" : ""}</button>
                    <br/>
                    {message}
                </form>
            </div>
            <VerifyCode
                email={email}
                visibility={visibility}
                setVisibility={setVisibility}
                refresh={sendEmail}
                next={"/profile?changePass=true"}/>
        </div>
    )
}

export default Forgot