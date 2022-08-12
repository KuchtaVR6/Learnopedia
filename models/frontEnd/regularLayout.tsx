import {gql, useLazyQuery} from "@apollo/client";
import 'bootstrap/dist/css/bootstrap.css'
import Navbar from "../../models/frontEnd/navbar";
import CourseMenu from "../../models/frontEnd/courseMenu";

import {ReactNode, useEffect} from "react";

import styles from '../../styles/RegPage.module.css'
import {FC} from "react";
import {UserContext} from "./userContext";
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
            }
        }
    `
    const [fetch, {loading, error, data}] = useLazyQuery(getUser);

    useEffect(() => {
        if(enforceUser || window.sessionStorage.getItem("loggedIn")==="true"){
            fetch().catch((e) => {
                if(e.message === "Session has been Invalidated")
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
    },[])

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
    },[error])


    return (
        <UserContext.Provider value={{
            loggedIn: () => {return !!data},
            loading: () => {return loading},
            request: fetch,
            user: () => {return data? data.getUser : undefined}
        }}>
            <div className={styles.fullPage}>
                <Navbar/>
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