import {NextPage} from "next";
import styles from "../styles/Forms.module.css";
import Link from "next/link";
import VerifyCode from "../models/frontEnd/authentication/verifyCode";
import {useEffect, useRef, useState} from "react";
import {gql, useMutation} from "@apollo/client";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import Head from "next/head";

const Forgot: NextPage = () => {

    const [email, setEmail] = useState("");

    const [captchaToken, setCaptchaToken] = useState("");

    const captchaRef = useRef<HCaptcha>(null)

    const [allValid, setAllValid] = useState(false)

    const [visibility, setVisibility] = useState(false)
    const emailRef = useRef<HTMLInputElement>(null)

    const [message, setMessage] = useState("");

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

    const [sendEmail, {loading}] = useMutation(forgot, {
        variables: {
            email: email,
            captchaToken: captchaToken
        }
    });

    const reg = () => {
        if (allValid) {
            sendEmail().then(() => {
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
            <Head>
                <title>Learnopedia</title>
                <meta name={"description"} content={"This is the registration page of a great open community of learners where you can take a wide range of courses and create your own content."}/>
                <meta name={"keywords"} content={"Learnopedia, Learning, Course, Courses, Online, Create, Edit, Modify"}/>
            </Head>
            <div className={visibility ? [styles.page, styles.hide].join(" ") : styles.page}>
                <form className={styles.form} onSubmit={(e) => {
                    e.preventDefault()
                }}>

                    <Link href={"/"}>
                        <a className={styles.logoContainer} style={{height: "fit-content", paddingBottom: "1em"}}>
                            <img src={"/images/logo.svg"} alt="Learnopedia Logo" style={{display: "table"}}/>
                        </a>
                    </Link>

                    <br/>
                    <br/>

                    <h1>No password? No problem!</h1>
                    <br/>
                    Actually I do remember 😅<Link href={"/login"}>Login</Link><br/>
                    <div className={styles.field} style={{paddingBottom: "2em"}}>

                        <label htmlFor={"email"}>Email:</label> <br/>
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

                    <HCaptcha
                        ref = {captchaRef}
                        sitekey={process.env.NODE_ENV==="production"? process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY! : process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY_TEST!}
                        onVerify={(token) => setCaptchaToken(token)}
                    />

                    <br/>

                    <button disabled={!allValid} onClick={() => {
                        reg()
                    }}>Reset {allValid ? "✔" : ""}</button>
                    {loading? <div className={"loader"}></div> : ""}
                    <br/>
                    {message}
                </form>
            </div>
            <VerifyCode
                email={email}
                visibility={visibility}
                setVisibility={setVisibility}
                refresh={sendEmail}
                next={"/profile?changePass=true"}
                onExit={()=>{captchaRef.current!.resetCaptcha()}}/>
        </div>
    )
}

export default Forgot;