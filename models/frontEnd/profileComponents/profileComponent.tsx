import {FC, MutableRefObject, useContext, useEffect, useRef, useState} from "react";
import styles from "/styles/Profile.module.css";
import SimpleDetails from "./simpleDetails";
import ComplexActions from "./complexActions";
import {UserContext} from "../authentication/userContext";
import XpBar from "./xpBar";
import {useRouter} from "next/router";
import Link from "next/link";

const ProfileComponent: FC = () => {

    const imageRef = useRef<HTMLImageElement>() as MutableRefObject<HTMLImageElement>
    const [isPortrait, setIsPortrait] = useState(true)

    const checkImage = () => {
        if(imageRef.current)
            if(imageRef.current.height < imageRef.current.width) {
                setIsPortrait(false)
            }
    }

    const userContext = useContext(UserContext)

    const router = useRouter();
    useEffect(() => {
        checkImage()
    }, [])

    if (userContext.user() && userContext.request) {
        return (
            <div>
                <div className={styles.profile}>
                    <div className={styles.banner} style={{backgroundImage: `linear-gradient(90deg, ${userContext.user()?.colorA}, ${userContext.user()?.colorB})`}}>
                        <div className={styles.imageContainer}>
                            <img
                                src={userContext.user()?.avatarPath}
                                ref={imageRef}
                                alt={userContext.user()?.nickname + " profile image"}
                                style={{width: isPortrait? "100%" : "unset", height: isPortrait? "unset" : "100%"}}
                                onLoad={() => checkImage()}
                            />
                        </div>
                    </div>

                    <br/>
                    <br/>

                    <SimpleDetails data={userContext.user()} loading={userContext.loading()}/>

                    <XpBar xp={userContext.user()?.XP || 0}/>
                    <br/>
                    <br/>

                    <span className={"buttonNiceContainer"} style={{width: "fit-content", margin: "0 auto"}}>
                        <Link href={"/amendments/user/" + userContext.user()?.nickname}>
                            Amendments you have created
                        </Link>
                    </span>

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