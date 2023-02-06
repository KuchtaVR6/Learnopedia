import {NextPage} from "next";
import {useEffect, useState} from "react";
import {gql, useMutation} from "@apollo/client";
import Link from "next/link";
import styles from '../styles/Forms.module.css'
import Image from "next/image";
import VerifyCode from "../models/frontEnd/authentication/verifyCode";
import SelfValidatingInput from "../models/frontEnd/inputs/selfValidatingInput";
import PasswordValidator from "../models/frontEnd/authentication/passwordValidator";

import logo from "../public/images/logo.png";
import {ConstrainedInputTypes} from "../models/frontEnd/inputs/modifyDisplayConstrained";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import Head from "next/head";


const Register: NextPage = () => {

    const [nickname, setNick] = useState("");
    const [email, setEmail] = useState("");
    const [fname, setFName] = useState("");
    const [lname, setLName] = useState("");
    const [password, setPassword] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");
    const [error, setError] = useState("");

    const [allValid, setAllValid] = useState(false)

    const [visibility, setVisibility] = useState(false)

    const addUser = gql`
        mutation Mutation($nickname: String!, $email: String!, $lname: String!, $fname: String!, $password: String!, $captchaToken: String!) {
            addUser(nickname: $nickname, email: $email, lname: $lname, fname: $fname, password: $password, captchaToken : $captchaToken ) {
                continue
            }
        }
    `

    const [sendEmail] = useMutation(addUser, {
        variables: {
            nickname: nickname,
            email: email,
            lname: lname,
            fname: fname,
            password: password,
            captchaToken: captchaToken
        }
    });

    const checkNickname = gql`
        query Nickname($query : String!)
        {
            vacantNickname(nickname: $query) {
                query
                vacant
            }
        }
    `

    const checkEmail = gql`
        query Email($query : String!)
        {
            vacantEmail(email: $query) {
                query
                vacant
            }
        }
    `

    useEffect(() => {
        if (nickname && email && password && fname && lname && captchaToken) {
            setAllValid(true)
        } else {
            setAllValid(false)
        }
    }, [nickname, email, password, fname, lname, captchaToken])

    const reg = () => {
        if (allValid) {
            sendEmail().then(() => {
                setVisibility(true)
            }).catch((e) => {
                console.log(e)
                setError(e.message)
                //router.reload()
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

                    <div className={styles.logoContainer}>
                        <Image src={logo} alt="Learnopedia Logo"/>
                    </div>

                    <br/>
                    <br/>

                    <h1>Join the Learnopedia community</h1>
                    <br/>
                    Already a member?<Link href={"/login"}>Login</Link><br/>
                    <div className={styles.field}>
                        <label>Nickname: </label> <br/>
                        <SelfValidatingInput setProp={setNick}
                                             query={checkNickname}
                                             type={ConstrainedInputTypes.NICKNAME}
                                             autoComplete={"username"}/>

                        <br/>

                        <label className={styles.extraPad}>Email:</label> <br/>
                        <SelfValidatingInput setProp={setEmail}
                                             query={checkEmail}
                                             type={ConstrainedInputTypes.EMAIL}
                                             autoComplete={"email"}/>

                        <br/>

                        <label className={styles.extraPad}>Password:</label>
                        <PasswordValidator setProp={setPassword}/>

                        <br/>

                        <label className={styles.extraPad}>First Name:</label>

                        <input
                            required={true}
                            type={"text"}
                            name={"fname"}
                            id={"fname"}
                            autoComplete={"name-given"}
                            onChange={(e) => setFName(e.target.value)}
                        />
                        <p/>
                        <label>Last Name:</label> <br/>
                        <input
                            required={true}
                            type={"text"}
                            name={"lname"}
                            id={"lname"}
                            autoComplete={"name-family"}
                            onChange={(e) => setLName(e.target.value)}
                        /> <br/>
                        <br/>

                    </div>

                    <HCaptcha
                        sitekey={process.env.NODE_ENV==="production"? process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY! : process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY_TEST!}
                        onVerify={(token) => setCaptchaToken(token)}
                    />

                    <br/>

                    <button disabled={!allValid} onClick={() => {
                        reg()
                    }}>Register {allValid ? "✔" : ""}</button>
                    {error}

                    <br/>
                    <br/>
                    <br/>

                </form>
            </div>

            <VerifyCode
                email={email}
                visibility={visibility}
                setVisibility={setVisibility}
                refresh={sendEmail}/>

        </div>
    )
}

export default Register;