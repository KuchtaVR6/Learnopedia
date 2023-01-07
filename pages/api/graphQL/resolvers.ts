import {userResolvers} from "./resolvers/userResolvers";
import {verificationResolvers} from "./resolvers/verificationResolvers";
import {User} from "../../../models/backEnd/User";
import {contentAccessResolvers} from "./resolvers/contentAccessResolvers";
import {contentModificationResolvers} from "./resolvers/contentModificationResolvers";
import {imageResolvers} from "./resolvers/imageResolvers";

export type genericContext = {
    user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any
}

export const resolvers = {
    Query: Object.assign(verificationResolvers.Query, userResolvers.Query,contentAccessResolvers.Query, imageResolvers.Query),
    Mutation: Object.assign(verificationResolvers.Mutation, userResolvers.Mutation,contentModificationResolvers.Mutation, imageResolvers.Mutation)
};
