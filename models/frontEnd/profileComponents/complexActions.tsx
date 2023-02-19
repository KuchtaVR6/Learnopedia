import {FC, useEffect, useState} from "react";
import styles from "/styles/Profile.module.css";
import ModifyDisplayConstrained, {ConstrainedInputTypes} from "../inputs/modifyDisplayConstrained";
import {AiOutlineDelete} from "react-icons/ai";
import PasswordValidator from "../authentication/passwordValidator";
import {useRouter} from "next/router";
import {gql, useMutation} from "@apollo/client";
import VerifyCode from "../authentication/verifyCode";

type args = {
    data: any,
}

const ComplexActions: FC<args> = ({data}) => {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const emailMut = gql`
        mutation Mutation($email : String!){
            changeEmail(email: $email) {
                continue
            }
        }
    `

    const passMut = gql`
        mutation ChangePassword($password: String!) {
            changePassword(password: $password) {
                continue
            }
        }
    `

    const deleteMut = gql`
        mutation DeleteUser {
            deleteUser {
                continue
            }
        }
    `

    const [modEmail] = useMutation(emailMut,{
        variables: {
            email : email
        }
    })

    const [modPass] = useMutation(passMut, {
        variables: {
            password : password
        }
    })

    const [deleteUser] = useMutation(deleteMut)

    const [updatingEmail, setUpdatingEmail] = useState(false)
    const [updatingPass, setUpdatingPass] = useState(false)

    const [visibility, setVisibility] = useState(false)

    const router = useRouter()

    const sendModEmail = () => {

        setUpdatingEmail(true)

        modEmail().then(() => {
            setVisibility(true)
        }).catch(() => {})
    }

    const sendModPassword = () => {
        setUpdatingPass(true)

        modPass().then(() => {
            setVisibility(true)
            setUpdatingPass(false)
        })
    }

    const sendDelete = () => {
        let conf = window.confirm("Are you sure you want to delete your account? This action is irreversible!")

        if(conf) {
            deleteUser().then(() => {
                setVisibility(true)
            })
        }
    }

    useEffect(() => {
        if(router.query["changePass"])
        {
            window.alert("You are logged in. Proceed to changing your password.")
        }
    },[router.query])

    return (
        <div className={styles.zone}>
            <div className={styles.details}>
                <div className={styles.smallZone}>
                    <div className={styles.verticalCenter}>
                        {updatingEmail ? <h1>Updating...</h1> :
                            <>
                                <ModifyDisplayConstrained desc={"Email: "} value={data.email} setProp={setEmail}
                                                          type={ConstrainedInputTypes.EMAIL}/>
                                <button onClick={() => {sendModEmail()}} className={styles.submit} disabled={!email} >Change Email</button>
                            </>}
                    </div>
                </div>

                <div className={styles.smallZone}
                     style={{backgroundColor: router.query["changePass"] ? "#fff3a8" : ""}}>
                    {updatingPass ? <h1>Updating...</h1> :
                        <div className={styles.verticalCenter}>
                            <label>New Password:</label>
                            <div className={styles.userMod}>
                                <PasswordValidator setProp={setPassword}/>
                            </div>
                            <button onClick={() => {sendModPassword()}} className={styles.submit} disabled={!password} >Change Password
                            </button>
                        </div>
                    }
                </div>

                <div className={[styles.smallZone, styles.del].join(" ")}>
                    <AiOutlineDelete/>
                    <button onClick={sendDelete} className={styles.submit}>Delete Account</button>
                </div>
            </div>

            <VerifyCode email={data.email} visibility={visibility} setVisibility={setVisibility} refresh={modEmail} loggedIn={true} onExit={()=>{}}/>
        </div>
    )
}

export default ComplexActions;