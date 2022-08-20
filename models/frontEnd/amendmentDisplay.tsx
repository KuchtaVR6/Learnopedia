import {AmendmentOutput} from "../backEnd/amendments/Amendment";
import {FC} from "react";
import styles from "../../styles/ContentDisplay.module.css";
import KeywordDisplay from "./keywordCompoments/keywordDisplay";
import LessonPartDisplay from "./contentDisplays/lessonPartDisplay";
import {useRouter} from "next/router";
import RegularLayout from "./regularLayout";

type args = {
    input : AmendmentOutput[]
}

const AmendmentDisplay : FC<args> = ({input}) => {

    let x = 0;

    const router = useRouter()

    if(input.length>0) {
        return (
            <div>
                {
                    input.map((row) => {
                        x += 1;
                        return (
                            <div key={x} style={{opacity : row.applied? "100%" :"50%"}}>
                                <hr/>
                                <i>{row.creationDate}</i>
                                <h1>
                                    <button style={{borderRadius: "10px"}} onClick={() => {
                                        router.push("/user/" + row.creatorNickname)
                                    }}>
                                        <b>{row.creatorNickname}</b>
                                    </button> created
                                    an {row.otherDetails.__typename.slice(0, -6)} on:
                                </h1>
                                <div>
                                    <hr/>
                                    <i>{row.targetMeta.type === 0 ? "Course" : row.targetMeta.type === 1 ? "Chapter" : "Lesson"}</i>
                                    <br/>
                                    <button className={styles.hideButton} onClick={() => {
                                        router.push("/view/" + row.targetMeta.id)
                                    }}><h5>{row.targetMeta.name}</h5></button>
                                    <p className={styles.details}>
                                        {row.targetMeta.authors}<br/>
                                        Last Modified: {row.targetMeta.modification}<br/>
                                        Created: {row.targetMeta.creation}<br/>
                                        <KeywordDisplay keywords={row.targetMeta.keywords}/>
                                    </p>
                                    <hr/>
                                </div>
                                <i>Significance: {row.significance}</i>
                                <br/>
                                <i>Cost: {row.significance * row.tariff}</i>
                                <hr/>

                                <div  style={{backgroundColor: "lightgray", padding: "2%", margin: "2%", borderRadius: "10px"}}>
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
                                                        row.otherDetails.listChanges.map((change) => {
                                                            x += 1;
                                                            return <div key={x}>
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
                                                    </>
                                                    :
                                                    row.otherDetails.__typename === "AdoptionAmendmentOutput" ?
                                                        <>
                                                            <h3>{row.otherDetails.receiver ? "Was a receiver of an adoption" : "Had be transferred to a different parent"}</h3>
                                                            Newparent id is: <button
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
                                {row.applied? "" : <i>This amendment has not been applied</i>}
                                <hr/>
                            </div>
                        )
                    })
                }

            </div>
        )
    } else {
        return (
            <RegularLayout enforceUser={false}>
                <h1>No Amendments to be displayed</h1>
            </RegularLayout>
        )
    }
}

export default AmendmentDisplay;