import {gql, useLazyQuery} from "@apollo/client";
import 'bootstrap/dist/css/bootstrap.css'
import Navbar from "./navigational/navbar";
import CourseMenu from "./navigational/courseMenu";

import {ReactNode, useEffect, useState} from "react";

import styles from '../../styles/RegPage.module.css'
import {FC} from "react";
import {UserContext} from "./authentication/userContext";
import {useRouter} from "next/router";
import {FullOutput} from "../backEnd/contents/Content";

type args = {
    children: ReactNode,
    enforceUser: boolean,
    navigation? : FullOutput,
    noInlineNav? : boolean
}

const RegularLayout: FC<args> = ({children, enforceUser, navigation, noInlineNav}) => {

    const router = useRouter();

    const getUser = gql`
        query Query{
            getUser {
                nickname
                email
                lname
                fname
                XP
                avatarPath
                colorB
                colorA
            }
        }
    `

    const [logoutQuery] = useLazyQuery(
        gql`query Logout {
            logout {
                authorisation
            }
        }`
    )

    const [fetch, {loading, error, data}] = useLazyQuery(getUser);
    const [loggedOut, setLoggedOut] = useState(false);

    useEffect(() => {
        if(enforceUser || window.sessionStorage.getItem("loggedIn")==="true"){
            fetch().catch((e) => {
                if(e.message === "Session has been Invalidated" || e.message === "Refresh Token is Invalid")
                {
                    window.sessionStorage.setItem("loggedIn","false")
                    if(enforceUser)
                    {
                        router.push("/login")
                    }
                }
                else{
                    window.alert(e.message)
                }
            });
        }
    },[fetch, enforceUser, router])

    useEffect(() => {
        if(error)
        {
            if (error.message === "Session has been invalidated.") {
                window.sessionStorage.setItem("loggedIn", "false")
                if (enforceUser) {
                    router.push("/login?red="+router.asPath)
                }
            } else {
                window.alert(error.message)
            }
        }
    },[enforceUser,router, error])


    return (
        <UserContext.Provider value={{
            loggedIn: () => {if(!loggedOut) {return !!data} return false;},
            logout: () => {if(data) {logoutQuery()} setLoggedOut(true); window.sessionStorage.setItem("loggedIn","false")},
            loading: () => {return loading},
            request: fetch,
            user: () => {return data? data.getUser : undefined}
        }}>
            <div className={styles.fullPage}>
                <Navbar enforceUser={enforceUser}/>
                <div className={styles.limited}>
                    {children}
                    {noInlineNav? "" :
                        <>
                            <hr/>
                            <CourseMenu navigation={navigation} inline={true}/>
                        </>}
                </div>
                <CourseMenu navigation={navigation}/>
            </div>
        </UserContext.Provider>
    )
}

export default RegularLayout;