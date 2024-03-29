import RegularLayout from "../../../../models/frontEnd/regularLayout";
import {GetServerSidePropsContext, NextPage} from "next";
import client from "../../../../apollo-client";
import {fetchquery} from "../../../view/[viewId]";
import {FullOutput, MetaOutput} from "../../../../models/backEnd/contents/Content";
import {useEffect, useState} from "react";
import styles from "../../../../styles/ContentDisplay.module.css";
import {gql, useMutation} from "@apollo/client";
import {useRouter} from "next/router";
import LessonPartForm from "../../../../models/frontEnd/editForms/lessonpartForm";
import Head from "next/head";
import {lessonPartArgs} from "../../../../models/backEnd/lessonParts/LessonPartTypes";
import {BiArrowBack} from "react-icons/bi";
import {displayableOutput} from "../../../../models/backEnd/lessonParts/LessonPart";

const AddLessonPart: NextPage<{
    data: {
        mainMeta: MetaOutput,
        output: FullOutput
    }
}> = ({data}) => {

    const [mutationSpec, setMutationSpec] = useState(gql`
        mutation CreateParagraph($targetId: Int!, $args: ParagraphInput!, $seqNumber: Int!) {
            createParagraph(targetID: $targetId, args: $args, seqNumber: $seqNumber) {
                continue
            }
        }`)

    const router = useRouter();

    const [type, setType] = useState("PARAGRAPH")

    useEffect(() => {
        if (type === "PARAGRAPH") {
            setMutationSpec(gql`
                mutation CreateParagraph($targetId: Int!, $args: ParagraphInput!, $seqNumber: Int!) {
                    createParagraph(targetID: $targetId, args: $args, seqNumber: $seqNumber) {
                        continue
                    }
                }`)
        }
        if (type === "Embeddable") {
            setMutationSpec(gql`
                mutation CreateEmbeddable($targetId: Int!, $seqNumber: Int!, $args: EmbeddableInput!) {
                    createEmbeddable(targetID: $targetId, seqNumber: $seqNumber, args: $args) {
                        continue
                    }
                }`)
        }
        if (type === "QuizQuestion") {
            setMutationSpec(gql`
                mutation CreateQuizQuestion($targetId: Int!, $seqNumber: Int!, $args: QuizQuestionInput!) {
                    createQuizQuestion(targetID: $targetId, seqNumber: $seqNumber, args: $args) {
                        continue
                    }
                }`)
        }
    }, [type])

    const [changes, setChanges] = useState<lessonPartArgs | null>(null);
    const [seqNumber, setSeqNumber] = useState<number | null>(null)

    const [submitMut] = useMutation(mutationSpec, {
        variables: {
            targetId: parseInt(router.query.targetid as string),
            seqNumber: seqNumber,
            args: changes?.content
        }
    })

    const [warning, setWarning] = useState("")
    const [submitted, setSubmitted] = useState(false)

    const submit = async () => {
        submitMut().then(() => {
                setWarning("Changes saved correctly, please refer to amendments to view it.");
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
    }, [changes, seqNumber])

    useEffect(() => {
        if (data && data.mainMeta.type !== 2) {
            router.push("/edit/add/" + router.query.targetid)
        }
    }, [data])

    if (data && data.mainMeta.type == 2) {
        return (
            <RegularLayout enforceUser={true} navigation={data.output}>
                <Head>
                    <title>Adding LessonParts</title>
                    <meta name={"robots"} content={"noindex, nofollow"}/>
                </Head>
                <div className={styles.main}>
                    <div className={"buttonNiceContainer"}>
                        <a href={"/view/" + data.mainMeta.id}><BiArrowBack/>Back to the content</a>
                    </div>
                    <LessonPartForm
                        setChanges={setChanges}
                        type={type}
                        setType={setType}
                        seqNumber={seqNumber}
                        setSeqNumber={setSeqNumber}
                        others={data.output.content ? data.output.content : []}
                    />
                    <hr/>
                    <table className={styles.criteria}>
                        <tbody>
                        <tr>
                            <td>
                                SeqNumber
                            </td>
                            <td>
                                {seqNumber ? "✔" : "❌"}
                            </td>
                        </tr>
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
        return (
            <RegularLayout enforceUser={true} navigation={data.output}>
                <p>Redirecting...</p>
            </RegularLayout>
        )
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

export default AddLessonPart;