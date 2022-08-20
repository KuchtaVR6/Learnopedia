import RegularLayout from "../../../models/frontEnd/regularLayout";
import {GetServerSidePropsContext, NextPage} from "next";
import client from "../../../apollo-client";
import {fetchquery} from "../../view/[viewId]";
import {FullOutput, MetaOutput} from "../../../models/backEnd/contents/Content";
import {useEffect, useState} from "react";
import styles from "../../../styles/ContentDisplay.module.css";
import {gql, useMutation} from "@apollo/client";
import {useRouter} from "next/router";
import {lessonPartArgs, LessonPartInputs} from "../../../models/backEnd/lessonParts/LessonPartManager";
import LessonPartForm from "../../../models/frontEnd/editForms/lessonpartForm";
import {displayableOutput} from "../../../models/backEnd/lessonParts/LessonPart";

const EditLessonPart: NextPage<{
    data: {
        mainMeta: MetaOutput,
        output: FullOutput
    }
}> = ({data}) => {

    const [mutationSpec, setMutationSpec] = useState(gql`
        mutation ModToParagraph($targetId: Int!, $seqNumber: Int!, $oldId: Int!, $args: ParagraphInput!) {
            modToParagraph(targetID: $targetId, seqNumber: $seqNumber, oldID: $oldId, args: $args) {
                continue
            }
        }`)

    const router = useRouter();

    const [type, setType] = useState("PARAGRAPH")

    if (parseInt(router.query.child as string) < 0) {
        throw new Error("child id missing from the url")
    }

    const [extracted, setExtracted] = useState<displayableOutput | null>(null)

    useEffect(() => {
        const extractRelevant = () => {
            let x: displayableOutput | undefined;

            data.output.content?.map((child) => {
                if (child.id == parseInt(router.query.child as string)) {
                    x = child
                }
            })

            if (x) {
                setSeqNumber(x.seqNumber)
                setExtracted(x)
            } else {
                throw new Error(parseInt(router.query.child as string) + "child is not a part of this lesson")
            }
        }

        extractRelevant();
    }, [])

    useEffect(() => {
        if (type === "PARAGRAPH") {
            setMutationSpec(gql`
                mutation ModToParagraph($targetId: Int!, $seqNumber: Int!, $oldId: Int!, $args: ParagraphInput!) {
                    modToParagraph(targetID: $targetId, seqNumber: $seqNumber, oldID: $oldId, args: $args) {
                        continue
                    }
                }`)
        }
    }, [type])

    const [changes, setChanges] = useState<LessonPartInputs | null>(null);
    const [seqNumber, setSeqNumber] = useState<number | null>(null)

    const [submitMut, output] = useMutation(mutationSpec, {
        variables: {
            targetId: parseInt(router.query.targetid as string),
            seqNumber: seqNumber,
            args: changes,
            oldId: parseInt(router.query.child as string)
        }
    })

    const [warning, setWarning] = useState("")
    const [submitted, setSubmitted] = useState(false)

    const submit = async () => {
        submitMut().then(() => {
                setWarning("Changes saved correctly, it will take up to 20 minutes for the changes to be visible.");
                setSubmitted(true)
            }
        ).catch((e) => {
            setWarning(e.toString())
        })
    }

    const [validity, setValidity] = useState<boolean>(false)

    useEffect(() => {
        if (seqNumber && changes) {
            setValidity(true)
        } else {
            setValidity(false)
        }
    }, [changes])

    if (data.mainMeta.type == 2) {
        return (
            <RegularLayout enforceUser={true} navigation={data.output}>
                <div className={styles.main}>
                    {extracted ?
                        <LessonPartForm
                            setChanges={setChanges}
                            type={type}
                            setType={setType}
                            seqNumber={seqNumber}
                            current={extracted}
                        />
                        :
                        "Loading.."
                    }
                    <hr/>
                    <table className={styles.criteria}>
                        <tbody>
                        <tr>
                            <td>
                                LessonPart
                            </td>
                            <td>
                                {changes ? "✔" : "❌"}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2}>
                                {!submitted ? <button onClick={submit} className={styles.submit}
                                                      disabled={!validity}>Submit</button> : "You may close this page."}
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
    } else {
        throw new Error("Provided content is not a lesson.")
    }
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

export default EditLessonPart;