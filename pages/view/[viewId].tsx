import {GetServerSidePropsContext, NextPage} from "next";
import RegularLayout from "../../models/frontEnd/regularLayout";
import client from "../../apollo-client";
import {gql} from "@apollo/client";
import {FullOutput, MetaOutput} from "../../models/backEnd/contents/Content";
import ContentDisplay from "../../models/frontEnd/contentDisplays/contentDisplay";
import Head from "next/head";

const View: NextPage<{data : {
        mainMeta: MetaOutput,
        output: FullOutput
    }}> = ({data}) => {

    const jsonLD = () => {
        let creation = new Date(data.mainMeta.creation)
        let modified = new Date(data.mainMeta.modification)

        return (
            {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": data.mainMeta.name,
                "description": data.mainMeta.description,
                "author": {
                    "@type": "Organization",
                    "name": data.mainMeta.authors
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "Learnopedia",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://learnopedia.org/images/logo.png"
                    }
                },
                "datePublished": creation.getFullYear() + "-" + creation.getMonth() + "-" + creation.getDate(),
                "dateModified": modified.getFullYear() + "-" + modified.getMonth() + "-" + modified.getDate()
            }
        )
    }

    if(data) {
        return (
            <div>
                <Head>
                    <title>{data.mainMeta.name}</title>
                    <meta name={"description"} content={data.mainMeta.description}/>
                    <meta name={"keywords"} content={(data.mainMeta.keywords.map((keyword) => {
                        return keyword.word
                    })).join(", ")}/>
                    <script
                        key="structured-data"
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLD()) }}
                    />
                </Head>
                <RegularLayout enforceUser={false} navigation={data.output}>
                    <ContentDisplay meta={data.mainMeta} contents={data.output}/>
                </RegularLayout>
            </div>

        )
    }
    else{
        return <></>;
    }
}

export async function getServerSideProps(context : GetServerSidePropsContext) {

    const id = parseInt(context.query.viewId as string)

    if(id) {

        // Fetch data from external API
        const res = await client.query({
            query: fetchquery,
            variables: {
                viewId: id
            },
            fetchPolicy: "network-only",
        },)
        if (res.error) {
            return { notFound : true }
        }

        const data = (await res.data).view


        // Pass data to the page via props
        return {props: {data}}
    }
    return { notFound : true }
}

export const fetchquery = gql`
    query View($viewId: Int!) {
        view(id: $viewId) {
            mainMeta {
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
                upVotes
                downVotes
            }
            output {
                metas {
                    meta {
                        id
                        name
                        description
                        keywords {
                            ID
                            Score
                            word
                        }
                        seqNumber
                        type
                        creation
                        modification
                        authors
                    }
                    chapters {
                        meta {
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
                        lessons {
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
                    }
                }
                content {
                    seqNumber
                    output {
                        ... on ParagraphOutput {
                            basicText
                            advancedText
                        }
                        ... on EmbeddableOutput {
                            uri
                            type
                        }
                        ... on QuizQuestionOutput {
                            type
                            question
                            answer {
                                answerID
                                content
                                correct 
                                feedback 
                            }
                        }
                    }
                    id
                }
            }
        }
    }
`;

export default View;