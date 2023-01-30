import {NextPage} from "next";
import RegularLayout from "../models/frontEnd/regularLayout";
import ProfileComponent from "../models/frontEnd/profileComponents/profileComponent";
import Head from "next/head";

const Profile: NextPage = () => {

    return (
        <RegularLayout enforceUser={true} noInlineNav={true}>
            <Head>
                <title>Your profile</title>
                <meta name={"description"} content={"A great open community of learners where you can take a wide range of courses and create your own content."}/>
                <meta name={"keywords"} content={"Learnopedia, Learning, Course, Courses, Online, Create, Edit, Modify"}/>
                <meta name={"robots"} content={"noindex, nofollow"}/>
            </Head>
            <ProfileComponent/>
        </RegularLayout>
    )
}

export default Profile;