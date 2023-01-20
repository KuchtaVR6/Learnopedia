import {NextPage} from "next";
import {useState} from "react";
import {gql} from "@apollo/client";
import Link from "next/link";
import Authenticator from "../models/frontEnd/authentication/authenticator";
import Image from 'next/image'
import styles from '../styles/Forms.module.css'
import logo from "../public/images/logo.png";
import {useRouter} from "next/router";
import Head from "next/head";

const Login: NextPage = () => {

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    const loginQuery = gql`
        mutation Mutation($login: String!, $password: String!) {
            login(login: $login, password: $password) {
                authorisation
            }
        }
    `

    const router = useRouter();

    return (
        <div className={styles.page}>
            <Head>
                <title>Learnopedia</title>
                <meta name={"description"} content={"A great open community of learners where you can take a wide range of courses and create your own content."}/>
                <meta name={"keywords"} content={"Learnopedia, Learning, Course, Courses, Online, Create, Edit, Modify"}/>
            </Head>

            <form className={styles.form} onSubmit={(e) => {e.preventDefault()}}>

                <a className={styles.logoContainer} href={"/"}>
                    <Image src={logo} alt="Learnopedia Logo"/>
                </a>

                <br/>
                <br/>

                <h1>Login in to Learnopedia</h1><br/>

                Not a member yet? <Link href={"/register"}>Register</Link><br/>

                <div className={styles.field}>
                    <label>Email or nickname:</label>
                    <input
                        autoComplete={"email"}
                        type={"text"}
                        name={"identifier"}
                        required={true}
                        id={"email"}
                        onChange={(e) => setIdentifier(e.target.value)}
                    /> <br/><br/>
                    <label>Password:</label><br/>
                    <input
                        autoComplete={"current-password"}
                        name={"password"}
                        type={"password"}
                        required={true}
                        id={"current-password"}
                        onChange={(e) => setPassword(e.target.value)}
                    /> <br/><br/>
                </div>

                Forgot your password? <Link href={"/forgot"}>Reset your Password</Link><br/>


                <Authenticator
                    method={loginQuery}
                    args={
                        {
                            login: identifier,
                            password: password
                        }
                    }
                    next={(router.query.red as string)? router.query.red as string : "profile"}
                    buttonName={"Login"}
                    disable={!(password&&identifier)}
                />
                <br/>


            </form>
        </div>
    )
}

export default Login;