import {GetServerSidePropsContext, NextPage} from "next";
import RegularLayout from "../../models/frontEnd/regularLayout";
import styles from "../../styles/Profile.module.css";
import SimpleDetails from "../../models/frontEnd/profileComponents/simpleDetails";
import {gql} from "@apollo/client";
import XpBar from "../../models/frontEnd/profileComponents/xpBar";
import client from "../../apollo-client";
import {UserDetails} from "../../models/backEnd/User";
import {useRouter} from "next/router";
import Head from "next/head";
import {MutableRefObject, useEffect, useRef, useState} from "react";
import Link from "next/link";

type args = {
    data: UserDetails
}

const UserView: NextPage<args> = ({data}) => {

    const imageRef = useRef<HTMLImageElement>() as MutableRefObject<HTMLImageElement>
    const [isPortrait, setIsPortrait] = useState(true)

    const checkImage = () => {
        if(imageRef.current)
            if(imageRef.current.height < imageRef.current.width) {
                setIsPortrait(false)
            }
    }

    const router = useRouter();

    useEffect(() => {
        checkImage()
    }, [])

    return (
        <RegularLayout enforceUser={false} noInlineNav={true}>
            <Head>
                <title>Profile of {data.nickname}</title>
                <meta name={"description"} content={"This is the page of a member of the learnopedia platform."}/>
                <meta name={"keywords"} content={"Learnopedia, Learning, Course, Courses, Online, Create, Edit, Modify"}/>
            </Head>
            <div>
                <div className={styles.profile}>
                    <div className={styles.banner} style={{backgroundImage: `linear-gradient(90deg, ${data.colorA}, ${data.colorB})`}}>
                        <div className={styles.imageContainer}>
                            <img
                                src={data.avatarPath}
                                ref={imageRef}
                                alt={data.nickname + " profile image"}
                                style={{width: isPortrait? "100%" : "unset", height: isPortrait? "unset" : "100%"}}
                                onLoad={() => checkImage()}
                            />
                        </div>
                    </div>

                    <br/>
                    <br/>

                    <SimpleDetails data={data} loading={false} hideOptions={true}/>

                    <XpBar xp={data.XP}/>

                    <br/>
                    <br/>

                    <span className={"buttonNiceContainer"} style={{width: "fit-content", margin: "0 auto"}}>
                        <Link href={"/amendments/user/"+data.nickname}>
                            Check this users input to the community here
                        </Link>
                    </span>

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
            avatarPath
            colorA
            colorB
        }
    }
`


export default UserView;