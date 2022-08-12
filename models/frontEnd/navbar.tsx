import {FC, useContext, useState} from "react";
import styles from "../../styles/RegPage.module.css";
import Link from "next/link";
import {TbSearch} from "react-icons/tb";
import {GiFlexibleLamp} from "react-icons/gi";
import {UserContext} from "./userContext";
import {gql, useLazyQuery} from "@apollo/client";
import {useRouter} from "next/router";

const Navbar: FC = () => {

    const router = useRouter();

    const userContext = useContext(UserContext)

    const [searchInput,setSearchInput] = useState("");

    const [showWarning, setShowWarning] = useState(false)

    const logoutQuery = gql`
        query Logout {
            logout {
                authorisation
            }
        }
    `

    const [logout] = useLazyQuery(logoutQuery)

    const search = () => {
        if(searchInput.length > 2)
        {
            router.push("/search/"+searchInput)
        }else{
            setShowWarning(true)
            setTimeout(() => {setShowWarning(false)},5000)
        }
    }

    return (
        <div className={styles.navbarMain}>
            <div className={styles.logoContainer}>
                <Link href={"/"}><i><GiFlexibleLamp/>Learnopedia</i></Link>
            </div>

            <div className={styles.linkContainer}>

                {userContext.loggedIn() ?
                    <>
                        <a>
                        <button onClick={
                            () =>
                            {
                                logout().then(
                                    () => {
                                        //todo
                                        window.sessionStorage.setItem("loggedIn","false")
                                        router.push("/")
                                    })}}>Logout</button>
                        </a>
                        <Link href={"/profile"}>Profile</Link>
                    </>
                    :
                    <>
                        <Link href={"/register"}>Register</Link>
                        <Link href={"/login?red="+router.asPath}>Login</Link>
                    </>
                }
                <span className={styles.searchBar}>
                    <input type={"text"} onChange={(e) => {setSearchInput(e.target.value)}} onKeyPress={(e) => {if(e.key === 'Enter') {search()}}}/>
                    <button className={styles.searchButton} onClick={() => {search()}}><TbSearch/></button>
                    <p className={showWarning? styles.searchWarning : styles.hide}>The search has to be at least 3 characters long</p>
                </span>
            </div>
        </div>
    )
}

export default Navbar;