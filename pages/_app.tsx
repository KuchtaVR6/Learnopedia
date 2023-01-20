import '../styles/globals.css'
import type {AppProps} from 'next/app'
import {ApolloClient, ApolloProvider, InMemoryCache} from "@apollo/client";
import Head from "next/head";

export const client = new ApolloClient({
    uri: "/api/graphql",
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
