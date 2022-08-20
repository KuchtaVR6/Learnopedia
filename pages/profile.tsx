import {NextPage} from "next";
import RegularLayout from "../models/frontEnd/regularLayout";
import ProfileComponent from "../models/frontEnd/profileComponents/profileComponent";

const Profile: NextPage = () => {

    return (
        <RegularLayout enforceUser={true} noInlineNav={true}>
            <ProfileComponent/>
        </RegularLayout>
    )
}

export default Profile;