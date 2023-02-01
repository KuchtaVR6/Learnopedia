import RegularLayout from "../../../models/frontEnd/regularLayout";
import {GetServerSidePropsContext, NextPage} from "next";
import client from "../../../apollo-client";
import {fetchquery} from "../../view/[viewId]";
import {FullOutput, MetaOutput} from "../../../models/backEnd/contents/Content";
import {useEffect, useState} from "react";
import styles from "../../../styles/ContentDisplay.module.css";
import {gql, useMutation} from "@apollo/client";
import {useRouter} from "next/router";
import EvaluatorInput from "../../../models/frontEnd/inputs/evaluatorInput";
import Head from "next/head";
import {BiArrowBack} from "react-icons/bi";

const Adopt: NextPage<{
    data: {
        mainMeta: MetaOutput,
        output: FullOutput
    }
}> = ({data}) => {

    const mutationSpec = gql`
        mutation AdoptionAmendment($targetID: Int!, $newParent: Int!) {
            adoptionAmendment(targetID: $targetID, newParent: $newParent) {
                continue
            }
        }
    `

    const router = useRouter();

    const [futureParent, setFutureParent] = useState<number>(-1);

    const [submitMut, output] = useMutation(mutationSpec, {
        variables : {
            targetID : parseInt(router.query.targetid as string),
            newParent : futureParent
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
        if (futureParent>=0) {
            setValidity(true)
        } else {
            setValidity(false)
        }
    }, [futureParent])

    const [stringInput, setStringInput] = useState<string>("")

    useEffect(() => {
        let x = parseInt(stringInput)
        if(x>=0)
        {
            setFutureParent(x)
        }
        else{
            let table = stringInput.split("/")

            let x = parseInt(table[table.length-1])

            if(x >= 0)
            {
                setFutureParent(x)
            }
            else{
                setFutureParent(-1)
            }
        }
    },[stringInput])

    const condition = (input : string) => {
        if(parseInt(input)>=0)
        {
            if(parseFloat(input)%1!==0)
            {
                throw new Error("ID must be an Integer")
            }
        }
        else{
            let table = input.split("/")

            if(parseInt(table[table.length-1])>=0)
            {
                if(parseFloat(table[table.length-1])%1!==0)
                {
                    throw new Error("Invalid link")
                }
            }
            else{
                throw new Error("Invalid link")
            }
        }
    }

    if (data.mainMeta.type !== 0) {
        return (
            <RegularLayout enforceUser={true} navigation={data.output}>
                <Head>
                    <title>Adoption</title>
                    <meta name={"robots"} content={"noindex, nofollow"}/>
                </Head>
                <div className={styles.main}>
                    <div className={"buttonNiceContainer"}>
                        <a href={"/view/"+data.mainMeta.id}><BiArrowBack/>Back to the content</a>
                    </div>
                    <h1>Change parent</h1>
                    <p>Paste the new parents link or ID:</p>
                    &nbsp;&nbsp;<EvaluatorInput width={25} condition={condition} setInput={setStringInput}/>
                    <hr/>
                    <table className={styles.criteria}>
                        <tbody>
                        <tr>
                            <td>
                                New Parent
                            </td>
                            <td>
                                {futureParent>=0 ? "✔" : "❌"}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2}>
                                {!submitted? <button onClick={submit} className={styles.submit} disabled={!validity || output.loading}>Submit</button> : "You may close this window."}
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
    else {
        return (
            <RegularLayout enforceUser={false} navigation={data.output}>
                <Head>
                    <title>Error</title>
                    <meta name={"robots"} content={"noindex, nofollow"}/>
                </Head>
                <p>It is not possible to adopt a Course as it has no Parent.</p>
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

export default Adopt;