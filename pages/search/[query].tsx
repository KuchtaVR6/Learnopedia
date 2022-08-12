import {GetServerSidePropsContext, NextPage} from "next";
import RegularLayout from "../../models/frontEnd/regularLayout";
import {useRouter} from "next/router";
import client from "../../apollo-client";
import {gql} from "@apollo/client";
import {MetaOutput} from "../../models/backEnd/contents/Content";
import SearchDisplay from "../../models/frontEnd/searchDisplay";

const Search: NextPage<{data : {
        score: number,
        content: MetaOutput
    }[]}> = ({data}) => {

    const router = useRouter();

    return (
        <RegularLayout enforceUser={false}>
            <SearchDisplay array={data} query={(router.query.query as string)}/>
        </RegularLayout>
    )
}

export async function getServerSideProps(context : GetServerSidePropsContext) {

    const id = (context.query.query as string)

    // Fetch data from external API
    const res = await client.query({
        query : gql`
            query Search($query: String!) {
                search(query: $query) {
                    score
                    content {
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
        `,
        variables : {
            query : id
        }
    },)
    const data = (await res.data).search

    // Pass data to the page via props
    return { props: { data } }
}


export default Search;