import {FC, useContext, useEffect} from "react";
import styles from "/styles/Profile.module.css";
import SimpleDetails from "./simpleDetails";
import ComplexActions from "./complexActions";
import {UserContext} from "../authentication/userContext";
import Image from "next/image";
import defaultImage from "../../../public/images/defProfile.png"
import XpBar from "./xpBar";
import {useRouter} from "next/router";

const ProfileComponent: FC = () => {

    const userContext = useContext(UserContext)

    const router = useRouter();

    if (userContext.user() && userContext.request) {
        return (
            <div>
                <div className={styles.profile}>
                    <div className={styles.banner}>
                        <div className={styles.imageContainer}>
                            <Image src={defaultImage} objectFit={"contain"}
                                   alt={userContext.user()?.nickname + " profile image"}/>
                        </div>
                    </div>

                    <br/>
                    <br/>

                    <SimpleDetails data={userContext.user()} loading={userContext.loading()}/>

                    <XpBar xp={userContext.user()?.XP || 0}/>
                    <br/>
                    <br/>

                    <button className={"buttonNice"} style={{width: "fit-content", margin: "0 auto"}} onClick={() => {
                        router.push("/amendments/user/" + userContext.user()?.nickname)
                    }}>
                        Amendments you have created
                    </button>

                    <ComplexActions data={userContext.user()}/>


                </div>

            </div>
        )
    } else {
        return (
            <div>
                Loading...
            </div>
        )
    }

}

export default ProfileComponent;