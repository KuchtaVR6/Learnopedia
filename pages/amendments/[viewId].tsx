import {GetServerSidePropsContext, NextPage} from "next";
import RegularLayout from "../../models/frontEnd/regularLayout";
import client from "../../apollo-client";
import {gql} from "@apollo/client";
import {AmendmentOutput} from "../../models/backEnd/amendments/Amendment";
import AmendmentDisplay from "../../models/frontEnd/amendmentDisplay";
import Head from "next/head";
import styles from "../../styles/ContentDisplay.module.css";
import {useRouter} from "next/router";
import {BiArrowBack} from "react-icons/bi";

const ContentsAmendments: NextPage<{ data: AmendmentOutput[] }> = ({data}) => {

    let router = useRouter();

    if (data) {
        return (
            <div>
                <RegularLayout enforceUser={false} noInlineNav={true}>
                    <Head>
                        <title>Learnopedia</title>
                        <meta name={"robots"} content={"noindex, nofollow"}/>
                    </Head>
                    <div className = {styles.main}>
                        <div className={"buttonNiceContainer"}>
                            <a href={"/view/"+router.query.viewId}><BiArrowBack/>Back to the content</a>
                        </div>
                        <AmendmentDisplay input={data}/>
                    </div>
                </RegularLayout>
            </div>
        )
    } else {
        return <></>;
    }
}

export async function getServerSideProps(context: GetServerSidePropsContext) {

        const id = parseInt(context.query.viewId as string)

    if (id) {

        // Fetch data from external API
        const res = await client.query({
            query: query,
            variables: {
                getContentAmendmentsId: id
            },
            fetchPolicy: "network-only",
        },)
        if (res.error) {
            return {notFound: true}
        }

        const data = (await res.data).getContentAmendments

        // Pass data to the page via props
        return {props: {data}}
    }
    return {notFound: true}
}

const query = gql`
    query GetContentAmendments($getContentAmendmentsId: Int!) {
        getContentAmendments(id: $getContentAmendmentsId) {
            otherDetails {
                ... on MetaAmendmentOutput {
                    newName
                    newDescription
                    addedKeywords {
                        ID
                        Score
                        word
                    }
                    deletedKeywords {
                        ID
                        Score
                        word
                    }

                }
                ... on ListAmendmentOutput {
                    listChanges {
                        ChildID
                        LessonPartID
                        newSeqNumber
                        delete
                    }
                }
                ... on CreationAmendmentOutput {
                    name
                    description
                    keywords {
                        Score
                        ID
                        word
                    }
                    seqNumber
                }
                ... on PartAddReplaceAmendmentOutput {
                    change {
                        id
                        seqNumber
                        output {
                            ... on ParagraphOutput {
                                basicText
                                advancedText

                            }
                            ... on EmbeddableOutput {
                                type
                                uri
                            }
                            ... on QuizQuestionOutput {
                                type
                                question 
                                answer {
                                    answerID
                                    feedback 
                                    correct
                                    content
                                } 
                            }
                        }
                    }
                    seqNumber
                    oldID
                    old {
                        id
                        seqNumber
                        output {
                            ... on ParagraphOutput {
                                basicText
                                advancedText

                            }
                            ... on EmbeddableOutput {
                                type
                                uri
                            }
                            ... on QuizQuestionOutput {
                                type
                                question
                                answer {
                                    answerID
                                    feedback
                                    correct
                                    content
                                }
                            }
                        }
                    }
                }
                ... on AdoptionAmendmentOutput {
                    newParent
                    receiver
                }
            }
            id
            creatorNickname
            creationDate
            significance
            tariff
            targetMeta {
                id
                name
                description
                keywords {
                    ID
                    Score
                    word
                }
                type
                seqNumber
                creation
                modification
                authors
            }
            applied
            vetoed
        }
    }
`

export default ContentsAmendments;