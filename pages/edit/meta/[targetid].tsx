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
import {BiArrowBack} from "react-icons/bi";

export type MetaChanges = {
    title: string | null,
    description: string | null,
    deletedKeywords: number[] | null,
    addedKeywords: { word: string, Score: number }[] | null,
    seqNumber: number | null
}

const EditChild: NextPage<{
    data: {
        mainMeta: MetaOutput,
        output: FullOutput
    }
}> = ({data}) => {

    const calculateKeywords = () => {
        let total = 0;
        if (data.mainMeta.keywords) {
            total += data.mainMeta.keywords.length
        }
        if (changes.addedKeywords) {
            total += changes.addedKeywords.length
        }
        if (changes.deletedKeywords) {
            total -= changes.deletedKeywords.length
        }
        return total;
    }

    const mutationSpec = gql`
        mutation MetaAmendment($targetId: Int!, $changes: MetaAmendmentChanges) {
            metaAmendment(targetID: $targetId, changes: $changes) {
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
        variables: {
            targetId: parseInt(router.query.targetid as string),
            changes: {
                newName: changes.title !== data.mainMeta.name ? changes.title : null,
                newDescription: changes.description !== data.mainMeta.description ? changes.description : null,
                addedKeywords: changes.addedKeywords,
                deletedKeywordIDs: changes.deletedKeywords
            }
        }
    })

    const[warning, setWarning] = useState("")
    const[submitted, setSubmitted] = useState(false)

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
        if (changes.title || changes.description || (changes.addedKeywords && changes.addedKeywords.length > 0)) {
            if(calculateKeywords()>3) {
                setValidity(true)
            }
            else{
                setValidity(false)
            }
        } else {
            setValidity(false)
        }
    }, [changes])

    return (
        <RegularLayout enforceUser={true} navigation={data.output}>
            <Head>
                <title>Edit meta</title>
                <meta name={"robots"} content={"noindex, nofollow"}/>
            </Head>
            <div className={styles.main}>
                <div className={"buttonNiceContainer"}>
                    <a href={"/view/"+data.mainMeta.id}><BiArrowBack/>Back to the content</a>
                </div>
                <MetaForm type={data.mainMeta.type}
                          parentTitle={data.mainMeta.name}
                          setOutput={setChanges}
                          main={data.mainMeta}
                />
                <hr/>
                <table className={styles.criteria}>
                    <tbody>
                    <tr>
                        <td>
                            Title
                        </td>
                        <td>
                            {changes.title && changes.title !== data.mainMeta.name ? "📝" : "📕"}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Description
                        </td>
                        <td>
                            {changes.description && changes.description !== data.mainMeta.description ? "📝" : "📕"}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Keywords (min. 4)
                        </td>
                        <td>
                            {!changes.addedKeywords && !changes.deletedKeywords ? "📕" : (calculateKeywords() > 3) ? "📝" : "❌"}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            {!submitted? <button onClick={submit} className={styles.submit} disabled={!validity}>Submit</button> : "You may close this window."}
                        </td>
                    </tr>
                    <tr>
                        <td>
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

export default EditChild;