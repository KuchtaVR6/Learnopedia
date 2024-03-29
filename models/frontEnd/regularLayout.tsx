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
import {AiOutlineRocket} from "react-icons/ai";

type args = {
    children: ReactNode,
    enforceUser: boolean,
    navigation?: FullOutput,
    noInlineNav?: boolean
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
        if (enforceUser || window.localStorage.getItem("loggedIn") === "true") {
            fetch().catch((e) => {
                if (e.message === "Session has been Invalidated" || e.message === "Refresh Token is Invalid") {
                    window.localStorage.setItem("loggedIn", "false")
                    if (enforceUser) {
                        router.push("/login?red=" + router.asPath)
                    }
                } else {
                    console.log("I caused an alert!")
                    window.alert(e.message)
                }
            });
        }
    }, [fetch, enforceUser, router])

    const [showBackTop, setShowBackTop] = useState(false)

    const showBackToTop = () => {
        if (window.scrollY > 700) {
            if (!showBackTop) {
                setShowBackTop(true)
            }
        } else {
            if (showBackTop) {
                setShowBackTop(false)
            }
        }
    }

    useEffect(() => {
        if (error) {
            if (error.message === "Session has been invalidated." || error.message === "Refresh Token is Invalid") {
                window.localStorage.setItem("loggedIn", "false")
                if (enforceUser) {
                    router.push("/login?red=" + router.asPath)
                }
            } else {
                console.log("2", error)
                window.alert(error.message)
            }
        }

        addEventListener("scroll", () => {
            showBackToTop()
        })

    }, [enforceUser, router, error])


    return (
        <UserContext.Provider value={{
            loggedIn: () => {
                if (!loggedOut) {
                    return !!data
                }
                return false;
            },
            logout: () => {
                if (data) {
                    logoutQuery()
                }
                setLoggedOut(true);
                window.localStorage.setItem("loggedIn", "false")
            },
            loading: () => {
                return loading
            },
            request: fetch,
            user: () => {
                return data ? data.getUser : undefined
            }
        }}>
            <div className={styles.fullPage}>
                <Navbar enforceUser={enforceUser}/>
                <div className={styles.limited}>
                    <div style={{position: "absolute", top: 0, visibility: "hidden"}} id={"top"}></div>
                    {children}
                    {noInlineNav ? "" :
                        <>
                            <hr/>
                            <CourseMenu navigation={navigation} inline={true}/>
                        </>}
                </div>
                <CourseMenu navigation={navigation}/>
                <a href={"#top"} style={{
                    position: "fixed",
                    bottom: "2%",
                    left: "2%",
                    opacity: "90%",
                    textAlign: "center",
                    backgroundColor: "whitesmoke",
                    padding: "0.2em 0.5em",
                    borderRadius: "5px",
                    zIndex: 20,
                    visibility: showBackTop ? "visible" : "hidden",
                    fontSize: "1.3em",
                    textDecoration: "none",
                    color: "black"
                }}>
                    <AiOutlineRocket/> Back to the top
                </a>
            </div>
        </UserContext.Provider>
    )
}

export default RegularLayout;