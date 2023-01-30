import RegularLayout from "../../../models/frontEnd/regularLayout";
import {GetServerSidePropsContext, NextPage} from "next";
import client from "../../../apollo-client";
import {fetchquery} from "../../view/[viewId]";
import {FullOutput, MetaOutput} from "../../../models/backEnd/contents/Content";
import MetaForm from "../../../models/frontEnd/editForms/metaForm";
import {useEffect, useState} from "react";
import styles from "../../../styles/ContentDisplay.module.css";
import {gql, useMutation} from "@apollo/client";
import {useRouter} from "next/router";
import Head from "next/head";

export type MetaChanges = {
    title: string | null,
    description: string | null,
    deletedKeywords: number[] | null,
    addedKeywords: { word: string, Score: number }[] | null,
    seqNumber: number | null
}

const AddChild: NextPage<{
    data: {
        mainMeta: MetaOutput,
        output: FullOutput
    }
}> = ({data}) => {
    const extractRelevant = (): MetaOutput[] => {
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

    const mutationSpec = gql`
        mutation CreationAmendment($name: String!, $description: String!, $seqNumber: Int!, $type: Int!, $keywords: [keywordInput!]!, $parentID : Int!) {
            creationAmendment(name: $name, description: $description, seqNumber: $seqNumber, type: $type, keywords: $keywords, parentID: $parentID) {
                continue
            }
    }`

    const router = useRouter();

    const [changes, setChanges] = useState<MetaChanges>({
        title: null,
        description: null,
        deletedKeywords: null,
        addedKeywords: null,
        seqNumber: null,
    });

    const [submitMut] = useMutation(mutationSpec, {
        variables : {
            name : changes.title,
            description : changes.description,
            seqNumber : changes.seqNumber,
            type : data.mainMeta.type+1,
            keywords : changes.addedKeywords,
            parentID : parseInt(router.query.targetid as string)
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
        if (changes.title && changes.description && changes.addedKeywords && changes.addedKeywords.length > 3 && changes.seqNumber) {
            setValidity(true)
        } else {
            setValidity(false)
        }
    }, [changes])

    useEffect(()=>{
        if(data && data.mainMeta.type===2) {
            router.push("/edit/add/lessonpart/"+router.query.targetid)
        }
    },[data])

    if (data && data.mainMeta.type !== 2) {
        return (
            <RegularLayout enforceUser={true} navigation={data.output}>
                <Head>
                    <title>Add Content</title>
                    <meta name={"robots"} content={"noindex, nofollow"}/>
                </Head>
                <div className={styles.main}>
                    <MetaForm type={data.mainMeta.type + 1}
                              parentTitle={data.mainMeta.name}
                              navigation={extractRelevant()}
                              setOutput={setChanges}
                    />
                    <hr/>
                    <table className={styles.criteria}>
                        <tr>
                            <td>
                                Title
                            </td>
                            <td>
                                {changes.title ? "✔" : "❌"}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Description
                            </td>
                            <td>
                                {changes.description ? "✔" : "❌"}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Keywords (min. 4)
                            </td>
                            <td>
                                {!changes.addedKeywords ? "❌" : (changes.addedKeywords.length > 3) ? "✔" : "❌"}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Sequence Number
                            </td>
                            <td>
                                {changes.seqNumber ? "✔" : "❌"}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2}>
                                {!submitted? <button onClick={submit} className={styles.submit} disabled={!validity}>Submit</button> : "You may close this page."}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2}>
                                <p>{warning}</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </RegularLayout>
        )
    }
    else {
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

export default AddChild;