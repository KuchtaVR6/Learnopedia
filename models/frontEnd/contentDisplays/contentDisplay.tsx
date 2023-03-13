import {FC, useContext, useEffect, useRef, useState} from "react";
import {FullOutput, MetaOutput} from "../../backEnd/contents/Content";
import NavigationTile from "../navigational/navigationTile";
import KeywordDisplay from "../keywordCompoments/keywordDisplay";
import styles from "../../../styles/ContentDisplay.module.css";
import {UserContext} from "../authentication/userContext";
import EditButton from "../inputs/editButton";
import LessonPartDisplay from "./lessonPartDisplay";
import {BiDownvote, BiUpvote} from "react-icons/bi";
import {gql, useMutation} from "@apollo/client";
import {BsClockFill, BsFillBookmarkHeartFill, BsFillBookmarkXFill} from "react-icons/bs";
import Link from "next/link";
import {AiTwotoneEdit} from "react-icons/ai";
import {useRouter} from "next/router";

type args = {
    meta: MetaOutput,
    contents: FullOutput,
}

const ContentDisplay: FC<args> = ({meta, contents}) => {

    const countMyViewMutation = gql`
        mutation CountMyView($countMyViewId: Int!, $loggedIn: Boolean!) {
            countMyView(id: $countMyViewId, loggedIn: $loggedIn) {
                vote
                bookmark
                reminderDate
            }
        }
    `

    const voteQuery = gql`
        mutation Vote($contentId: Int!, $positive: Boolean!) {
            vote(contentID: $contentId, positive: $positive) {
                continue
            }
        }
    `

    const [bookmarkAppend, baOutput] = useMutation(gql`mutation AppendBookmark($contentId: Int!, $reminderDate: String) {
        appendBookmark(contentID: $contentId, reminderDate: $reminderDate) {
            continue
        }
    }`)

    const [bookmarkDelete, bdOutput] = useMutation(gql`mutation DeleteBookmark($contentId: Int!) {
        deleteBookmark(contentID: $contentId) {
            continue
        }
    }`)


    const userContext = useContext(UserContext)

    const [voteQuerySend, voteOutcome] = useMutation(voteQuery)

    let router = useRouter();

    const vote = async (positive: boolean) => {
        await voteQuerySend({
            variables: {
                contentId: meta.id,
                positive: positive
            }
        })

        if (voteVal === positive) {
            if (voteVal) {
                setAdjustUp(adjustUp - 1)
            } else {
                setAdjustDown(adjustDown - 1)
            }
            setVoteValue(null)
        } else {
            if (voteVal) {
                setAdjustUp(adjustUp - 1)
            } else if (voteVal === false) {
                setAdjustDown(adjustDown - 1)
            }
            if (positive) {
                setAdjustUp(adjustUp + 1)
            } else {
                setAdjustDown(adjustDown + 1)
            }
            setVoteValue(positive)
        }


    }

    const bookmarkSend = async () => {
        if (bookmark === false) {
            await bookmarkAppend({
                variables: {
                    contentId: meta.id
                }
            }).then(() => {
                setBookmark(true);
            })
        } else {
            await bookmarkDelete({
                variables: {
                    contentId: meta.id
                }
            }).then(() => {
                setBookmark(false)
            })
        }
    }

    const [voteVal, setVoteValue] = useState<boolean | null>(null)
    const [bookmark, setBookmark] = useState<boolean | Date>(false)
    const [adjustDown, setAdjustDown] = useState(0)
    const [adjustUp, setAdjustUp] = useState(0)

    const [enableEdit, setEnableEdit] = useState(false)

    const [sendCountMyView, queryVote] = useMutation(countMyViewMutation)
    const awaitingQueryVote = useRef(false);

    let keyCounter = 0;

    useEffect(() => {
            if (queryVote.data && queryVote.data.countMyView.bookmark !== null) {
                if (awaitingQueryVote.current) {
                    awaitingQueryVote.current = false;
                    if (voteVal === null)
                        if (queryVote.data.countMyView.vote === true || queryVote.data.countMyView.vote === false)
                            setVoteValue(queryVote.data.countMyView.vote)
                    if (queryVote.data.countMyView.bookmark) {
                        if (queryVote.data.countMyView.reminderDate)
                            setBookmark(queryVote.data.countMyView.reminderDate)
                        else
                            setBookmark(true)
                    } else {
                        setBookmark(false)
                    }
                }
            }
        }, [queryVote, voteVal]
    )

    useEffect(() => {
        setAdjustUp(0)
        setAdjustDown(0)
        setVoteValue(null)
        setBookmark(false)
        awaitingQueryVote.current = true;

        sendCountMyView({
            variables: {
                countMyViewId: meta.id,
                loggedIn: userContext.loggedIn()
            }
        }).catch(() => {
        });

    }, [meta, userContext])

    return (
        <div className={styles.main}>
            {enableEdit ?
                <>
                    <EditButton loggedIn={userContext.loggedIn()} label={"Edit Meta"} path={"/edit/meta/" + meta.id}/>
                    {(userContext.loggedIn() && meta.type !== 0) ?
                        <EditButton loggedIn={userContext.loggedIn()} label={"Change parent"}
                                    path={"/edit/adopt/" + meta.id}/> : ""}
                </>
                :
                ""
            }

            <span className={"buttonNiceContainer"} style={{float: "right", marginRight: "1%"}}>
                <Link className={"buttonNice"} href={"/amendments/" + meta.id}>
                    Amendments
                </Link>
            </span>

            <h1>
                {meta.name}
            </h1>
            <hr/>
            {userContext.loggedIn() ?
                <button
                    className={"buttonNice"}
                    style={{
                        float: "right",
                        marginRight: "1%",
                        backgroundColor: enableEdit ? "orange" : "lightgray"
                    }}
                    onClick={() => {
                        setEnableEdit(!enableEdit)
                    }}>
                    <AiTwotoneEdit/> {enableEdit ? "Disable Edit Mode" : "Enable Edit Mode"}
                </button>
                :
                ""
            }

            <button
                className={"buttonNice"}
                style={{
                    float: "right",
                    marginRight: "1%",
                    backgroundColor: voteVal === false ? "orange" : "lightgray",
                    opacity: userContext.loggedIn()? "100%" : "50%"
                }}
                disabled={voteOutcome.loading || queryVote.loading}
                onClick={() => {
                    if(!userContext.loggedIn()) {
                        router.push("/login?red="+router.asPath)
                    }
                    else {
                        vote(false)
                    }
                }}>
                <BiDownvote/> {meta.downVotes + adjustDown}
            </button>
            <button
                className={"buttonNice"}
                style={{
                    float: "right",
                    marginRight: "1%",
                    backgroundColor: voteVal === true ? "orange" : "lightgray",
                    opacity: userContext.loggedIn()? "100%" : "50%"
                }}
                disabled={voteOutcome.loading || queryVote.loading}
                onClick={() => {
                    if(!userContext.loggedIn()) {
                        router.push("/login?red="+router.asPath)
                    }
                    else{
                        vote(true)
                    }
                }}>
                <BiUpvote/> {meta.upVotes + adjustUp}
            </button>
            <button
                className={"buttonNice"}
                style={{
                    float: "right",
                    marginRight: "1%",
                    backgroundColor: bookmark !== false ? "orange" : "",
                    opacity: userContext.loggedIn()? "100%" : "50%"
                }}
                disabled={voteOutcome.loading || queryVote.loading}
                onClick={() => {
                    if(!userContext.loggedIn()) {
                        router.push("/login?red="+router.asPath)
                    }
                    else {
                        bookmarkSend()
                    }
                }}
            >
                {bookmark === true ? <><BsFillBookmarkXFill/>&nbsp;Remove Bookmark</> : bookmark === false ? <>
                    <BsFillBookmarkHeartFill/>&nbsp;Bookmark</> : <><BsFillBookmarkXFill/> <BsClockFill/>&nbsp;Remove
                    Bookmark </>}
            </button>
            {bookmark === false || !userContext.loggedIn() ? "" :
                <span className={"buttonNiceContainer"}>
                    <a
                        href={"/setReminder/" + meta.id}
                        style={{
                            float: "right",
                            marginRight: "1%",
                            marginTop: "3px",
                            backgroundColor: bookmark !== true ? "orange" : "lightgrey"
                        }}>
                        {bookmark === true ? <> <BsClockFill/>&nbsp;Add reminder</> : <> <BsClockFill/>&nbsp;Replace
                            reminder due on {bookmark} </>}
                    </a>
                </span>
            }
            <p>
                Authors: {meta.authors} <br/>
                Last Modified: {meta.modification} <br/>
                Created: {meta.creation} <br/>
                Type: {meta.type === 0? "Course" : meta.type===1? "Chapter" : "Lesson"}
            </p>
            <hr/>
            <KeywordDisplay keywords={meta.keywords}/>
            <hr/>
            <p>
                {meta.description}
            </p>
            <hr/>
            <table style={{width: "100%"}}>
                <tbody>
                {enableEdit ?
                    <tr>
                        <td>
                            <EditButton loggedIn={userContext.loggedIn()}
                                        label={meta.type == 0 ? "Add a Chapter" : meta.type == 1 ? "Add a Lesson" : "Add a part"}
                                        path={meta.type != 2 ? "/edit/add/" + meta.id : "/edit/add/lessonpart/" + meta.id}/>
                            {userContext.loggedIn() ?
                                <EditButton loggedIn={userContext.loggedIn()} label={"Edit the list"}
                                            path={"/edit/list/" + meta.id}/> : ""}

                            <br/>
                            <br/>
                            <hr/>
                        </td>
                    </tr> : ""
                }
                <tr>
                    {contents.content ?
                        <td>
                            {
                                contents.content.map((row) => {
                                    return <LessonPartDisplay row={row} key={row.id} loggedIn={userContext.loggedIn()}
                                                              id={meta.id} enableEdits={enableEdit}/>
                                })
                            }
                        </td>

                        :

                        meta.type == 0 ?

                            <td>
                                <h2>Chapters:</h2>
                                {
                                    contents.metas.chapters.map((chapter) => {
                                        let x = chapter.lessons.map((lesson) => {
                                            return <NavigationTile key={lesson.id} meta={lesson}/>
                                        })
                                        keyCounter += 1;
                                        return (
                                            <div key={keyCounter}>
                                                <hr/>
                                                {enableEdit?
                                                    <>
                                                        ----------------------------------<br/>
                                                        ID: {chapter.meta.id} | SeqNumber : {chapter.meta.seqNumber}<br/>
                                                        ----------------------------------
                                                    </>
                                                    :
                                                    ""
                                                }

                                                <span className={"buttonNiceContainer"}>
                                                    <Link href={"/view/" + chapter.meta.id}>
                                                        <h3>{chapter.meta.name}</h3>
                                                    </Link>
                                                </span>
                                                <p className={styles.details}>
                                                    {chapter.meta.authors}<br/>
                                                    Last Modified: {chapter.meta.modification}<br/>
                                                    Created: {chapter.meta.creation}
                                                </p>
                                                {chapter.meta.description}<br/>
                                                <b>Lessons:</b><br/>
                                                {x}
                                            </div>
                                        )
                                    })
                                }
                            </td>

                            :

                            meta.type == 1 ?

                                <td>
                                    <h2>Lessons:</h2>
                                    {
                                        contents.metas.chapters.map((chapter) => {
                                            if (chapter.meta.id === meta.id) {
                                                let x = chapter.lessons.map((lesson) => {
                                                    keyCounter += 1;
                                                    return (
                                                        <div key={keyCounter}>
                                                            <hr/>
                                                            {enableEdit?
                                                                <>
                                                                    ----------------------------------<br/>
                                                                    ID: {lesson.id} | SeqNumber : {lesson.seqNumber}<br/>
                                                                    ----------------------------------
                                                                </>
                                                                :
                                                                ""
                                                            }
                                                            <span className={"buttonNiceContainer"}>
                                                                <Link href={"/view/" + lesson.id}>
                                                                    <h3>{lesson.name}</h3>
                                                                </Link>
                                                            </span>
                                                            <p className={styles.details}>
                                                                {lesson.authors}<br/>
                                                                Last Modified: {lesson.modification}<br/>
                                                                Created: {lesson.creation}
                                                            </p>
                                                            {lesson.description} <br/>
                                                        </div>
                                                    )
                                                })
                                                keyCounter += 1;
                                                return (
                                                    <div key={keyCounter}>
                                                        {x}
                                                    </div>
                                                )
                                            }
                                        })
                                    }
                                </td>

                                :

                                ""
                    }
                </tr>

                </tbody>
            </table>
        </div>
    )
}

export default ContentDisplay;