import {NextPage} from "next";
import RegularLayout from "../models/frontEnd/regularLayout";
import Head from "next/head";
import styles from "../styles/ContentDisplay.module.css";
import {gql, useMutation, useQuery} from "@apollo/client";
import AmendmentDisplay from "../models/frontEnd/amendmentDisplay";
import EvaluatorInput from "../models/frontEnd/inputs/evaluatorInput";
import {useEffect, useState} from "react";

const Profile: NextPage = () => {

    const reported = useQuery(fetchReported)

    const [lastChanged, setLastChanged] = useState("delay")
    const [timestamp, setTimestamp] = useState(new Date(new Date((new Date).getTime() + 5 * 60 * 60 * 1000).toLocaleString("en-US", {timeZone: "Europe/London"})))

    const [nickname, setNickname] = useState("")
    const [reason, setReason] = useState("")

    const [hideId, setHideId] = useState(-1)
    const [innerHideId, setInnerHideId] = useState("")

    const [error1, setError1] = useState("")
    const [error2, setError2] = useState("")

    const setDelay = (delay: string) => {
        setLastChanged("delay")
        let delayInt = Number(delay) * 60 * 60 * 1000

        setTimestamp(new Date(new Date((new Date).getTime() + delayInt).toLocaleString("en-US", {timeZone: "Europe/London"})))
    }

    const setTime = (time: string) => {
        setLastChanged("exact")
        setTimestamp(new Date(new Date(time).toLocaleString("en-US", {timeZone: "Europe/London"})))
    }

    const [sendSuspendUser, sendSuspendUserData] = useMutation(gql`mutation MODERATOR_suspendUser($userNickname: String!, $suspensionLift: String!, $reason: String!) {
        MODERATOR_suspendUser(userNickname: $userNickname, suspensionLift: $suspensionLift, reason: $reason) {
            continue
        }
    }`, {
        variables: {
            userNickname: nickname,
            suspensionLift: String(timestamp),
            reason: reason
        }
    })

    const [sendHideContent, sendSuspendHideData] = useMutation(gql`mutation MODERATOR_hideContent($contentId: Int!) {
        MODERATOR_hideContent(contentID: $contentId) {
            continue
        }
    }`, {
        variables: {
            contentId: hideId
        }
    })


    useEffect(() => {
        if (sendSuspendHideData.error) {
            setError1(sendSuspendHideData.error.name)
        }
        if (sendSuspendUserData.error) {
            setError2(sendSuspendUserData.error.name)
        }
    }, [sendSuspendHideData, sendSuspendUserData])

    return (
        <RegularLayout enforceUser={true} noInlineNav={true}>
            <Head>
                <title>Moderator View</title>
                <meta name={"robots"} content={"noindex, nofollow"}/>
            </Head>
            <div className={styles.main}>
                <h1>Reported Content:</h1>
                <div style={{maxHeight: "30em", overflowY: "scroll", border: "5px solid"}}>
                    {reported.data ? <AmendmentDisplay input={reported.data.MODERATOR_fetchReported}/> : "loading..."}
                </div>

                <h1>Suspend User</h1>

                Nickname:
                <EvaluatorInput condition={(input: string) => {
                    if (input.length < 4) {
                        throw new Error("all nickname are at least 4 chars long")
                    }
                }} setInput={setNickname} width={20}/>
                Reason:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <EvaluatorInput condition={(input: string) => {
                    if (input.length < 10) {
                        throw new Error("reason must be at least 10 chars long")
                    }
                }} setInput={setReason} textarea={{rows: 5, columns: 20}}/>

                <table>
                    <tbody>
                    <tr>
                        <td>
                            <h2 style={{marginRight: "3em", marginTop: "2px"}}>Choose exact time and date...</h2>
                            <input type={"datetime-local"}
                                   style={{fontSize: "150%", opacity: lastChanged === "exact" ? "1" : "0.5"}}
                                   onChange={(e) => {
                                       setTime(e.target.value)
                                   }}/>
                        </td>
                        <td>
                            <h2> or simply select the delay</h2>
                            <select style={{fontSize: "150%", opacity: lastChanged === "delay" ? "1" : "0.5"}}
                                    onChange={(e) => {
                                        setDelay(e.target.value)
                                    }}>
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

                <button
                    onClick={() => {
                        setNickname("")
                        setReason("");
                        sendSuspendUser();
                    }}
                    disabled={nickname.length < 4 || reason.length < 10}>
                    Send suspension
                </button>
                {error1}
                <hr/>

                <h1>Hide Content (id or paste the link in)</h1>
                <EvaluatorInput condition={(input: string) => {
                    setHideId(-1)
                    let split = input.split("/")
                    let final = split[split.length - 1]
                    if (isNaN(+final)) {
                        throw new Error("incorrect input")
                    } else {
                        setHideId(Number(final))
                    }
                }} setInput={setInnerHideId} width={20}/>
                <button
                    onClick={() => {
                        setHideId(0)
                        sendHideContent();
                    }}
                    disabled={hideId < 0}>Send hide request
                </button>
                {error2}
            </div>
        </RegularLayout>
    )
}

const fetchReported = gql`
    query MODERATOR_fetchReported {
        MODERATOR_fetchReported {
            id
            creatorNickname
            creationDate
            significance
            tariff
            targetMeta {
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
            applied
            vetoed
            otherDetails {
                ... on MetaAmendmentOutput {
                    newName
                    newDescription
                    addedKeywords {
                        ID
                        Score
                        word
                    }
                    deletedKeywords {
                        ID
                        Score
                        word
                    }
                }
                ... on ListAmendmentOutput {
                    listChanges {
                        ChildID
                        LessonPartID
                        newSeqNumber
                        delete
                    }
                }
                ... on CreationAmendmentOutput {
                    name
                    description
                    keywords {
                        ID
                        Score
                        word
                    }
                    seqNumber
                }
                ... on PartAddReplaceAmendmentOutput {
                    change {
                        id
                        seqNumber
                        output {
                            ... on ParagraphOutput {
                                basicText
                                advancedText
                            }
                            ... on EmbeddableOutput {
                                uri
                                type
                            }
                            ... on QuizQuestionOutput {
                                question
                                type
                                answer {
                                    answerID
                                    content
                                    correct
                                    feedback
                                }
                            }
                        }
                    }
                    seqNumber
                    oldID
                    old {
                        id
                        seqNumber
                        output {
                            ... on ParagraphOutput {
                                basicText
                                advancedText
                            }
                            ... on EmbeddableOutput {
                                uri
                                type
                            }
                            ... on QuizQuestionOutput {
                                question
                                type
                                answer {
                                    answerID
                                    content
                                    correct
                                    feedback
                                }
                            }
                        }
                    }
                }
                ... on AdoptionAmendmentOutput {
                    newParent
                    receiver
                }
            }
        }
    }`

export default Profile;