import {GetServerSidePropsContext, NextPage} from "next";
import RegularLayout from "../../models/frontEnd/regularLayout";
import styles from "../../styles/Profile.module.css";
import Image from "next/image";
import defaultImage from "../../public/images/defProfile.png";
import SimpleDetails from "../../models/frontEnd/profileComponents/simpleDetails";
import {gql} from "@apollo/client";
import XpBar from "../../models/frontEnd/profileComponents/xpBar";
import client from "../../apollo-client";
import {UserDetails} from "../../models/backEnd/User";
import {useRouter} from "next/router";

type args = {
    data: UserDetails
}

const UserView: NextPage<args> = ({data}) => {

    const router = useRouter();

    return (
        <RegularLayout enforceUser={false} noInlineNav={true}>
            <div>
                <div className={styles.profile}>
                    <div className={styles.banner}>
                        <div className={styles.imageContainer}>
                            <Image src={defaultImage} objectFit={"contain"}
                                   alt={data.nickname + " profile image"}/>
                        </div>
                    </div>

                    <br/>
                    <br/>

                    <SimpleDetails data={data} loading={false} hideOptions={true}/>

                    <XpBar xp={data.XP}/>

                    <br/>
                    <br/>

                    <button className={"buttonNice"} style={{width: "fit-content", margin: "0 auto"}} onClick={() => {router.push("/amendments/user/"+data.nickname)}}>
                        Check this users input to the community here
                    </button>

                </div>

            </div>
        </RegularLayout>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {

    const id = (context.query.nickname as string)

    if (id) {

        // Fetch data from external API
        const res = await client.query({
            query: getUser,
            variables: {
                nickname: id
            },
            fetchPolicy: "network-only",
        },)
        if (res.error) {
            return {notFound: true}
        }

        const data = (await res.data).getUser

        // Pass data to the page via props
        return {props: {data}}
    }
    return {notFound: true}
}

const getUser = gql`
    query GetUser($nickname: String) {
        getUser(nickname: $nickname) {
            nickname
            email
            lname
            fname
            XP
        }
    }
`


export default UserView;