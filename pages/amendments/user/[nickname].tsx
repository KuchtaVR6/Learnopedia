import {GetServerSidePropsContext, NextPage} from "next";
import RegularLayout from "../../../models/frontEnd/regularLayout";
import client from "../../../apollo-client";
import {gql, useQuery} from "@apollo/client";
import {AmendmentOutput} from "../../../models/backEnd/amendments/Amendment";
import AmendmentDisplay from "../../../models/frontEnd/amendmentDisplay";

const UsersAmendments: NextPage<{ data: AmendmentOutput[] }> = ({data}) => {

    let x = 0;

    if (data) {
        return (
            <div>
                <RegularLayout enforceUser={false} noInlineNav={true}>
                    <AmendmentDisplay input={data}/>
                </RegularLayout>
            </div>

        )
    } else {
        return <></>;
    }
}

export async function getServerSideProps(context: GetServerSidePropsContext) {

    const id = context.query.nickname as string

    if (id) {

        // Fetch data from external API
        const res = await client.query({
            query: query,
            variables: {
                getUsersAmendmentsId: id
            },
            fetchPolicy: "network-only",
        },)
        if (res.error) {
            return {notFound: true}
        }

        const data = (await res.data).getUsersAmendments

        // Pass data to the page via props
        return {props: {data}}
    }
    return {notFound: true}
}

const query = gql`
    query GetUsersAmendments($getUsersAmendmentsId: String!) {
        getUsersAmendments(nickname: $getUsersAmendmentsId) {
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
                            ... on VideoOutput {
                                url
                            }
                        }
                    }
                    seqNumber
                    oldID
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
        }
    }
`

export default UsersAmendments;