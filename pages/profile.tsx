import {NextPage} from "next";
import RegularLayout from "../models/frontEnd/regularLayout";
import ProfileComponent from "../models/frontEnd/profileComponents/profileComponent";
import Head from "next/head";

const Profile: NextPage = () => {

    return (
        <RegularLayout enforceUser={true} noInlineNav={true}>
            <Head>
                <title>Learnopedia</title>
                <meta name={"description"} content={"A great open community of learners where you can take a wide range of courses and create your own content."}/>
                <meta name={"keywords"} content={"Learnopedia, Learning, Course, Courses, Online, Create, Edit, Modify"}/>
            </Head>
            <ProfileComponent/>
        </RegularLayout>
    )
}

export default Profile;