import '../styles/globals.css'
import type {AppProps} from 'next/app'
import {ApolloClient, ApolloProvider, gql, InMemoryCache, useQuery} from "@apollo/client";
import {UserContext} from "../models/frontEnd/authentication/userContext";
import Head from "next/head";

export const client = new ApolloClient({
    uri: "http://localhost:3000/api/graphql",
    cache: new InMemoryCache()
});

function MyApp({Component, pageProps}: AppProps) {

    return (

            <ApolloProvider client={client}>
                <Head>
                    <title>Learnopedia</title>
                </Head>
                <Component {...pageProps} />
            </ApolloProvider>

    )
}

export default MyApp
