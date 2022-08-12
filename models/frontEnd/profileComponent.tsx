import {FC, useContext, useEffect} from "react";
import styles from "/styles/Profile.module.css";
import SimpleDetails from "./simpleDetails";
import ComplexActions from "./complexActions";
import {UserContext} from "./userContext";
import Image from "next/image";
import defaultImage from "../../public/images/defProfile.png"

const ProfileComponent: FC = () => {

    const userContext = useContext(UserContext)

    if(userContext.user() && userContext.request) {
        return (
            <div>
                <div className={styles.profile}>
                    <div className={styles.banner}>
                        <div className={styles.imageContainer}>
                            <Image src={defaultImage} objectFit={"contain"} alt={userContext.user()?.nickname+" profile image"}/>
                        </div>
                    </div>

                    <br/>
                    <br/>

                    <SimpleDetails data={userContext.user()} loading={userContext.loading()}/>

                    <ComplexActions data={userContext.user()}/>

                </div>

            </div>
        )
    }
    else{
        return (
            <div>
                Loading...
            </div>
        )
    }

}

export default ProfileComponent;