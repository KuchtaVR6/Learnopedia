import { ApolloServer } from "apollo-server-micro";
import {typeDefs} from "./graphQL/typeDefs";
import {resolvers} from "./graphQL/resolvers";

const httpHeadersPlugin = require("apollo-server-plugin-http-headers");

import cors from "cors"
import initMiddleware from "./graphQL/initMiddleware";
import {SessionRegistry} from "../../models/backEnd/managers/SessionRegistry";
import {UserManager} from "../../models/backEnd/managers/UserManager";

const SessionRegistryInstance = SessionRegistry.getInstance()
const UserManagerInstance = UserManager.getInstance()

export const resolveUser = async (cookie : string | undefined, agent : string | undefined) => {
    if(cookie && agent)
    {
        let user = await SessionRegistryInstance.getSession(cookie,agent)
        if(user)
        {
            return user;
        }
    }
    return null
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [httpHeadersPlugin],

    context: async ({ req, res }) => ({
        user: await resolveUser(req.cookies["accessToken"],req.headers['user-agent']),
        agent: req.headers['user-agent'],
        refreshToken: req.cookies["refreshToken"],
        initialToken: req.cookies['initialToken'],
        setCookies: [],
        setHeaders: []
    })
});
const startServer = server.start()
const Cors = initMiddleware(
    cors({
        origin: "https://studio.apollographql.com",
        credentials: true
    })
)
export default async function handler(req: any, res: any){
    await Cors(req, res)
    await startServer;
    await server.createHandler({
        path: "/api/graphql"
    })(req, res)
}

export const config = {
    api: {
        bodyParser: false
    }
}