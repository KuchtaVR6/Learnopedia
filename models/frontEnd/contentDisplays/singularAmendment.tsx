import {FC, useContext, useEffect, useState} from "react";
import VotingPanel from "../inputs/votingPanel";
import styles from "../../../styles/ContentDisplay.module.css";
import KeywordDisplay from "../keywordCompoments/keywordDisplay";
import LessonPartDisplay from "./lessonPartDisplay";
import {AmendmentOutput, VotingSupport} from "../../backEnd/amendments/Amendment";
import {useRouter} from "next/router";
import {UserContext} from "../authentication/userContext";
import Link from "next/link";

type args =
    {
        row: AmendmentOutput
        voteOutputMap?: Map<number, VotingSupport>
        disableVotes: boolean
    }

const SingularAmendment: FC<args> = (args) => {

    const router = useRouter()

    const userContext = useContext(UserContext)

    const [voteOutput, setVOutput] = useState<VotingSupport | undefined>()

    let row = args.row

    useEffect(() => {
        setVOutput(args.voteOutputMap?.get(args.row.id))
    }, [args.voteOutputMap, args.row.id])

    return (
        <div style={{opacity: row.vetoed ? "70%" : "100%"}}>
            <i>{row.creationDate}</i>
            <h1>
                <span className={"buttonNiceContainer"}>
                    <Link href={"/user/" + row.creatorNickname}>
                        <b>{row.creatorNickname}</b>
                    </Link>
                </span>

                &nbsp;created
                an {row.otherDetails.__typename.slice(0, -6)} on:
            </h1>
            <div>
                <hr/>
                {
                    userContext.loggedIn() ?
                        <VotingPanel
                            applied={row.applied || row.vetoed}
                            cost={row.significance * row.tariff}
                            votingOutput={voteOutput}
                            disableVotes={args.disableVotes}
                            amendmentID={row.id}
                        />
                        :
                        ""
                }
                <div>
                    <i>{row.targetMeta.type === 0 ? "Course" : row.targetMeta.type === 1 ? "Chapter" : "Lesson"}</i>
                    <br/>
                    <span className={"buttonNiceContainer"}>
                        <Link href={"/view/" + row.targetMeta.id}>
                            <h3>{row.targetMeta.name}</h3>
                        </Link>
                    </span>
                    <p className={styles.details}>
                        {row.targetMeta.authors}<br/>
                        Last Modified: {row.targetMeta.modification}<br/>
                        Created: {row.targetMeta.creation}<br/>
                        <KeywordDisplay keywords={row.targetMeta.keywords}/>
                    </p>
                </div>
                <hr/>
            </div>
            <i>Significance: {row.significance}</i>
            <br/>
            <i>Cost: {row.significance * row.tariff}</i>
            <hr/>

            <div style={{
                backgroundColor: "lightgray",
                padding: "2%",
                margin: "2%",
                borderRadius: "10px"
            }}>
                {
                    row.otherDetails.__typename === "MetaAmendmentOutput" ?
                        <>
                            <h3>Meta changes where:</h3>
                            NewName: {row.otherDetails.newName ? row.otherDetails.newName : "NO CHANGES"}
                            <br/>
                            NewDescription: {row.otherDetails.newDescription ? row.otherDetails.newDescription : "NO CHANGES"}
                            <br/>
                            Added{row.otherDetails.addedKeywords ? <KeywordDisplay
                            keywords={row.otherDetails.addedKeywords}/> : "NO CHANGES"} <br/>
                            Deleted{row.otherDetails.deletedKeywords ? <KeywordDisplay
                            keywords={row.otherDetails.deletedKeywords}/> : "NO CHANGES"} <br/>
                        </>
                        :
                        row.otherDetails.__typename === "CreationAmendmentOutput" ?
                            <>
                                <h3>New content was created with:</h3>
                                Name: {row.otherDetails.name} <br/>
                                Description: {row.otherDetails.description} <br/>
                                {<KeywordDisplay keywords={row.otherDetails.keywords}/>} <br/>
                                SeqNumber: {row.otherDetails.seqNumber} <br/>
                            </>
                            :
                            row.otherDetails.__typename === "ListAmendmentOutput" ?
                                <>
                                    <h3>List changes were</h3>
                                    {
                                        row.otherDetails.listChanges.map((change, key) => {
                                            return <div key={key}>
                                                <button>
                                                    {change.ChildID ? change.ChildID : change.LessonPartID} - {change.delete ? "was deleted" : `was moved to seqNumber ${change.newSeqNumber}`}
                                                </button>
                                                <br/>
                                            </div>
                                        })
                                    }
                                </>
                                :
                                row.otherDetails.__typename === "PartAddReplaceAmendmentOutput" ?
                                    <>
                                        <h3>{row.otherDetails.oldID ? "Old part was modified to" : "A new part was created"}</h3>
                                        {row.otherDetails.change ?
                                            <LessonPartDisplay row={row.otherDetails.change}
                                                               key={row.id}
                                                               loggedIn={false}/> : ":("}
                                        {row.otherDetails.old ?
                                            <>
                                                <b>The lesson part {row.applied ? "was" : "is"}: </b>
                                                <LessonPartDisplay row={row.otherDetails.old} loggedIn={false}
                                                                   key={row.id}/>
                                            </> : ""
                                        }
                                    </>
                                    :
                                    row.otherDetails.__typename === "AdoptionAmendmentOutput" ?
                                        <>
                                            <h3>{row.otherDetails.receiver ? "Was a receiver of an adoption" : "Had be transferred to a different parent"}</h3>
                                            New parent id is: <button
                                            onClick={
                                                () => {
                                                    router.push(row.otherDetails.__typename === "AdoptionAmendmentOutput" ? `/view/${row.otherDetails.newParent}` : "")
                                                }
                                            }>{row.otherDetails.newParent}</button>

                                        </>
                                        :
                                        <>
                                            Not supported yet
                                        </>
                }
            </div>
            {row.applied ? "" : row.vetoed ? <i>This amendment has been vetoed</i> :
                <i>This amendment has not been yet applied</i>}
            <hr/>
        </div>
    )
}

export default SingularAmendment;