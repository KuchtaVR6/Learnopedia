import {GetServerSidePropsContext, NextPage} from "next";
import {gql, useMutation} from "@apollo/client";
import {MetaOutput} from "../../models/backEnd/contents/Content";
import Head from "next/head";
import RegularLayout from "../../models/frontEnd/regularLayout";
import client from "../../apollo-client";
import styles from "../../styles/ContentDisplay.module.css";
import KeywordDisplay from "../../models/frontEnd/keywordCompoments/keywordDisplay";
import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {BiArrowBack} from "react-icons/bi";

const SetReminder: NextPage<{
    data: {
        mainMeta: MetaOutput
    }
}> = ({data}) => {

    const [lastChanged, setLastChanged] = useState("delay")
    const [timestamp, setTimestamp] = useState(new Date(new Date((new Date).getTime() + 5 * 60 * 60 * 1000).toLocaleString("en-US", {timeZone: "Europe/London"})))

    const [bookmarkAppend, baOutput] = useMutation(gql`mutation AppendBookmark($contentId: Int!, $reminderDate: String) {
        appendBookmark(contentID: $contentId, reminderDate: $reminderDate) {
            continue
        }
    }`, { variables : {
            contentId : data.mainMeta.id,
            reminderDate : String(timestamp)
    }})

    const setDelay = (delay : string) => {
        setLastChanged("delay")
        let delayInt = Number(delay) * 60 * 60 * 1000

        setTimestamp(new Date(new Date((new Date).getTime() + delayInt).toLocaleString("en-US", {timeZone: "Europe/London"})))
    }

    const setTime = (time : string) => {
        setLastChanged("exact")
        setTimestamp(new Date(new Date(time).toLocaleString("en-US", {timeZone: "Europe/London"})))
    }

    let router = useRouter();

    useEffect(() => {
        if(baOutput.data) {
            router.push("/view/"+data.mainMeta.id)
        }
        if(baOutput.error) {
            window.alert("Unexpected error occurred...")
        }
    },[baOutput, data.mainMeta.id])

    return (
        <RegularLayout enforceUser={true}>
            <Head>
                <title>Set a Reminder</title>
                <meta name={"robots"} content={"noindex, nofollow"}/>
            </Head>
            <div className={styles.main}>
                <div className={"buttonNiceContainer"}>
                    <a href={"/view/"+data.mainMeta.id}><BiArrowBack/>Back to the content</a>
                </div>
                <h1>Set a reminder for:</h1>
                <div>
                    <hr/>
                    <i>{data.mainMeta.type === 0 ? "Course" : data.mainMeta.type === 1 ? "Chapter" : "Lesson"}</i>
                    <br/>
                    <Link className={styles.hideButton} href={"/view/" + data.mainMeta.id}><h5>{data.mainMeta.name}</h5></Link>
                    <div className={styles.details}>
                        {data.mainMeta.authors}<br/>
                        Last Modified: {data.mainMeta.modification}<br/>
                        Created: {data.mainMeta.creation}<br/>
                        <KeywordDisplay keywords={data.mainMeta.keywords}/>
                    </div>
                    {data.mainMeta.description}<br/>
                </div>
                <hr/>
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <h2 style={{marginRight: "3em", marginTop: "2px"}}>Choose exact time and date...</h2>
                                <input type={"datetime-local"} style={{fontSize: "150%", opacity: lastChanged==="exact"? "1" : "0.5"}} onChange={(e)=>{setTime(e.target.value)}}/>
                            </td>
                            <td>
                                <h2> or simply select the delay</h2>
                                <select style={{fontSize: "150%", opacity: lastChanged==="delay"? "1" : "0.5"}} onChange={(e)=>{setDelay(e.target.value)}}>
                                    <option value="2">2 hours</option>
                                    <option value="5">6 hours</option>
                                    <option value="12">12 hours</option>
                                    <option value="24">24 hours</option>
                                    <option value="48">48 hours</option>
                                    <option value="96">4 days</option>
                                    <option value="168">1 week</option>
                                    <option value="336">2 weeks</option>
                                    <option value="672">4 weeks</option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <hr/>
                <button
                    style={{margin: "0 auto"}}
                    className={"buttonNice"}
                    onClick={() => {bookmarkAppend()}}
                    disabled={baOutput.loading || baOutput.data || baOutput.error}>
                    {baOutput.loading? <div className={"loader"}></div> : baOutput.data? <div style={{margin: "0 auto"}}>Submitted ⏰</div> : "Submit Reminder"}
                </button>


            </div>

        </RegularLayout>
    )
}


export async function getServerSideProps(context: GetServerSidePropsContext) {

    const id = parseInt(context.query.viewId as string)

    if (id) {
        // Fetch data from external API
        const res = await client.query({
            query: fetchquery,
            variables: {
                viewId: id
            },
            fetchPolicy: "network-only",
        },)
        if (res.error) {
            return {notFound: true}
        }

        const data = (await res.data).view


        // Pass data to the page via props
        return {props: {data}}
    }
    return {notFound: true}
}

export const fetchquery = gql`
    query View($viewId: Int!) {
        view(id: $viewId) {
            mainMeta {
                id
                name
                description
                keywords {
                    ID
                    Score
                    word
                }
                type
                seqNumber
                creation
                modification
                authors
                upVotes
                downVotes
            }
        }
    }
`;

export default SetReminder;