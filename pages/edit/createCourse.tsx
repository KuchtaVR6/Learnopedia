import {useEffect, useState} from "react";
import styles from "../../styles/ContentDisplay.module.css";
import {gql, useMutation} from "@apollo/client";
import {NextPage} from "next";
import RegularLayout from "../../models/frontEnd/regularLayout";
import MetaForm from "../../models/frontEnd/editForms/metaForm";
import Head from "next/head";

export type MetaChanges = {
    title: string | null,
    description: string | null,
    deletedKeywords: number[] | null,
    addedKeywords: { word: string, Score: number }[] | null,
    seqNumber: number | null
}

const CreateCourse: NextPage = () => {

    const mutationSpec = gql`
        mutation CreationAmendment($name: String!, $description: String!, $seqNumber: Int!, $type: Int!, $keywords: [keywordInput!]!) {
            creationAmendment(name: $name, description: $description, seqNumber: $seqNumber, type: $type, keywords: $keywords) {
                continue
            }
        }`

    const [changes, setChanges] = useState<MetaChanges>({
        title: null,
        description: null,
        deletedKeywords: null,
        addedKeywords: null,
        seqNumber: null,
    });

    const [submitMut] = useMutation(mutationSpec, {
        variables: {
            name: changes.title,
            description: changes.description,
            seqNumber: 0,
            type: 0,
            keywords: changes.addedKeywords,
        }
    })

    const[warning, setWarning] = useState("")
    const[submitted, setSubmitted] = useState(false)

    const submit = async () => {
        submitMut().then(() => {
            setWarning("Course created successfully. You can close this page.");
            setSubmitted(true)
            }
        ).catch((e) => {
            setWarning(e.toString())
        })
    }

    const [validity, setValidity] = useState<boolean>(false)

    useEffect(() => {
        if (changes.title && changes.description && changes.addedKeywords && changes.addedKeywords.length > 3) {
            setValidity(true)
        } else {
            setValidity(false)
        }
    }, [changes])

    return (
        <RegularLayout enforceUser={true}>
            <Head>
                <title>Create Course</title>
                <meta name={"robots"} content={"noindex, nofollow"}/>
            </Head>
            <div className={styles.main}>
                <MetaForm type={0}
                          setOutput={setChanges}
                />
                <hr/>
                <table className={styles.criteria}>
                    <tbody>
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


export default CreateCourse;