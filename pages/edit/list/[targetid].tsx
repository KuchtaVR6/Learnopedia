import RegularLayout from "../../../models/frontEnd/regularLayout";
import {GetServerSidePropsContext, NextPage} from "next";
import client from "../../../apollo-client";
import {fetchquery} from "../../view/[viewId]";
import {FullOutput, MetaOutput} from "../../../models/backEnd/contents/Content";
import {useEffect, useState} from "react";
import styles from "../../../styles/ContentDisplay.module.css";
import {gql, useMutation} from "@apollo/client";
import {useRouter} from "next/router";
import {AiFillDelete} from "react-icons/ai";
import {displayableOutput} from "../../../models/backEnd/lessonParts/LessonPart";
import Head from "next/head";
import {BiArrowBack} from "react-icons/bi";


const ModList: NextPage<{
    data: {
        mainMeta: MetaOutput,
        output: FullOutput
    }
}> = ({data}) => {

    const mutationSpec = gql`
        mutation ListAmendment($targetID: Int!, $changes: [Changes!]!) {
            listAmendment(targetID: $targetID, changes: $changes) {
                continue
            }
        }
    `

    type listChange = {
        ChildID: number | null,
        LessonPartID: number | null,
        newSeqNumber: number | null,
        delete: boolean
    }

    const router = useRouter();

    const [listOfChanges, setLOCH] = useState<listChange[]>([])

    const [submitMut, output] = useMutation(mutationSpec, {
        variables: {
            targetID: parseInt(router.query.targetid as string),
            changes: listOfChanges
        }
    })

    const [warning, setWarning] = useState("")

    const [submitted, setSubmitted] = useState(false)

    const submit = async () => {
        submitMut().then(() => {
                setWarning("Changes saved correctly, it will take up to 20 minutes for the changes to be visible.");
                setSubmitted(true);
            }
        ).catch((e) => {
            setWarning(e.toString())
        })
    }

    const extractRelevant = (): MetaOutput[] | displayableOutput[] => {
        if (data.mainMeta.type !== 2) {
            if (data.mainMeta.id === data.output.metas.meta.id) {
                return data.output.metas.chapters.map((chapter) => {
                    return chapter.meta
                })
            } else {
                for (let chapter of data.output.metas.chapters) {
                    if (data.mainMeta.id === chapter.meta.id) {
                        return chapter.lessons
                    }
                }
            }
            throw new Error("Navigation not found")
        }
        if (data.output.content) {
            return data.output.content
        } else {
            throw new Error("Navigation not found")
        }
    }

    const [validity, setValidity] = useState<boolean>(false)

    const [selected, setSelected] = useState(-1)
    const [extracted, setExtracted] = useState(extractRelevant())
    const [extractedModifiable, setExtractedModifiable] = useState([...extracted])

    useEffect(() => {
        if (listOfChanges.length > 0) {
            setValidity(true)
        } else {
            setValidity(false)
        }

        let deletion;
        let x : MetaOutput[] | displayableOutput[];

        if(data.mainMeta.type===2)
        {
            x = new Array<displayableOutput>();
            for(let row of extracted)
            {
                deletion = false
                let copy = {...row as displayableOutput}

                for (let change of listOfChanges) {
                    if ((change.ChildID && row.id === change.ChildID) || (change.LessonPartID && row.id === change.LessonPartID))
                    {
                        if(!change.delete)
                        {
                            if(change.newSeqNumber)
                            {
                                copy.seqNumber = change.newSeqNumber
                            }
                        }
                        else{
                            deletion = true;
                        }
                    }
                }
                if(!deletion)
                {
                    x.push(copy)
                }
            }
        }
        else{
            x = new Array<MetaOutput>();
            for(let row of extracted)
            {
                deletion = false
                let copy = {...row as MetaOutput}
                for (let change of listOfChanges) {
                    if ((change.ChildID && row.id === change.ChildID) || (change.LessonPartID && row.id === change.LessonPartID))
                    {
                        if(!change.delete)
                        {
                            if(change.newSeqNumber)
                            {
                                copy.seqNumber = change.newSeqNumber
                            }
                        }
                        else{
                            deletion = true;
                        }
                    }
                }
                if(!deletion)
                {
                    x.push(copy)
                }
            }
        }

        x.sort((a, b) => {
            if (a.seqNumber > b.seqNumber) {
                return 1
            } else if (a.seqNumber == b.seqNumber) {
                return 0
            } else {
                return -1
            }
        })

        setExtractedModifiable(x);

        reset();
    }, [extracted, listOfChanges, data.mainMeta.type])

    const checkIfModded = (id: number) => {
        for (let child of listOfChanges) {
            if (child.ChildID == id || child.LessonPartID == id) {
                return true;
            }
        }
        return false
    }

    const reset = () => {
        setSelected(-1)
    }

    const getName = (arg : MetaOutput | displayableOutput) =>
    {
        let x = (arg as MetaOutput).name || undefined

        if(x){
            return x
        }
        else{
            return "lessonPart"
        }
    }

    const isL = () => {
        return data.mainMeta.type===2
    }

    let prevSeqNumber = 0;
    let noChange = 0;

    return (
        <RegularLayout enforceUser={true} navigation={data.output}>
            <Head>
                <title>Edit list</title>
                <meta name={"robots"} content={"noindex, nofollow"}/>
            </Head>
            <div className={styles.main}>
                <div className={"buttonNiceContainer"}>
                    <a href={"/view/"+data.mainMeta.id}><BiArrowBack/>Back to the content</a>
                </div>
                <h1>List modifications on {data.mainMeta.name}</h1>
                <hr/>
                <table style={{width: "100%"}}>
                    <tbody>
                    <tr>
                        <td>
                            <p>Choose the child to modify:</p>
                            {
                                extracted.map((child) => {
                                    let moded = checkIfModded(child.id);
                                    return (<>
                                        <button key={child.id} onClick={() => {
                                            setSelected(child.id)
                                        }} disabled={selected == child.id || moded}>
                                            {child.id} - {getName(child)} | {moded ? <>Already
                                            moded</> : <>SQNo.{child.seqNumber}</>}
                                        </button>
                                        <br/>
                                    </>)
                                })
                            }
                        </td>
                        <td>
                            <p>Perform</p>
                            <button disabled={!(selected >= 0)} onClick={() => {
                                setLOCH([...listOfChanges, {ChildID: isL()? null : selected, LessonPartID : isL()? selected : null, delete: true, newSeqNumber: null}]);
                            }}><AiFillDelete/>Delete
                            </button>
                            {
                                extractedModifiable.map((nav) => {
                                    let targetValue = Math.ceil(prevSeqNumber + ((nav.seqNumber - prevSeqNumber) / 2));
                                    if (targetValue !== nav.seqNumber && targetValue !== prevSeqNumber) {
                                        if (nav.id === selected) {
                                            noChange = 2;
                                        }
                                        let x = (
                                            <div key={nav.seqNumber}>
                                                <button
                                                    onClick={() => {
                                                        setLOCH([...listOfChanges, {
                                                            ChildID: isL()? null : selected,
                                                            LessonPartID : isL()? selected : null,
                                                            delete: false,
                                                            newSeqNumber: targetValue
                                                        }]);
                                                    }}
                                                    disabled={!(selected >= 0) || noChange !== 0}>
                                                    Insert Here | SQNo: <i>{targetValue}</i> {noChange !== 0 ?
                                                    <b>No change</b> : ""}
                                                </button>
                                                <br/>
                                                <b>{getName(nav)} | SQNo: <i>{nav.seqNumber}</i></b>
                                            </div>
                                        )
                                        prevSeqNumber = nav.seqNumber;
                                        if (noChange > 0) {
                                            noChange -= 1;
                                        }
                                        return x;
                                    } else {
                                        prevSeqNumber = nav.seqNumber;
                                        return (
                                            <div key={nav.seqNumber}>
                                                <button disabled={true}>SQNo. not possible<br/>Submit changes for list
                                                    re-balancing
                                                </button>
                                                <br/>
                                                <b>{getName(nav)} | SQNo: <i>{nav.seqNumber}</i></b>
                                            </div>)
                                    }
                                })
                            }
                            <button
                                onClick={() => {
                                    setLOCH([...listOfChanges, {
                                        ChildID: isL()? null : selected,
                                        LessonPartID : isL()? selected : null,
                                        delete: false,
                                        newSeqNumber: prevSeqNumber + 32
                                    }]);
                                }}
                                disabled={!(selected >= 0) || extractedModifiable.length == 0 || noChange !== 0}>
                                Insert Here |
                                SQNo: <i>{prevSeqNumber + 32}</i> {noChange !== 0 ? <b>No change</b> : ""}
                            </button>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <hr/>
                <p>Changes so far:</p>
                {listOfChanges.map((change) => {
                        return (
                            <>
                                <button
                                    key={change.ChildID? change.ChildID - 200 : change.LessonPartID! - 200}
                                    onClick={() => {
                                        setLOCH(listOfChanges.filter((row) => {
                                            return (!row.ChildID || row.ChildID !== change.ChildID) && (!row.LessonPartID || row.LessonPartID !== change.LessonPartID);
                                        }));
                                    }}
                                >
                                    <AiFillDelete/>
                                    {change.ChildID? change.ChildID : change.LessonPartID} - {change.delete ? "to be deleted" : `to be moved to seqNumber ${change.newSeqNumber}`}
                                </button>
                            </>)
                    }
                )}
                <hr/>
                <p>Current State:</p>
                {
                    extractedModifiable.map((row) => {
                        return (<p key={row.id}>
                            {row.id} - {getName(row)} | SQNo. {row.seqNumber}
                        </p>)
                    })
                }
                <table className={styles.criteria}>
                    <tbody>
                    <tr>
                        <td>
                            Changes
                        </td>
                        <td>
                            {listOfChanges.length > 0 ? "✔" : "❌"}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2}>
                            {!submitted ? <button onClick={submit} className={styles.submit}
                                                  disabled={!validity || output.loading}>Submit
                            </button> : "You may close this page."}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2}>
                            <p>{warning}</p>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </RegularLayout>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {

    const id = parseInt(context.query.targetid as string)
    if (id) {

        // Fetch data from external API
        const res = await client.query({
            query: fetchquery,
            variables: {
                viewId: id
            },
            fetchPolicy: "network-only"
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

export default ModList;