import {userResolvers} from "./resolvers/userResolvers";
import {verificationResolvers} from "./resolvers/verificationResolvers";
import {User} from "../../../models/backEnd/User";
import {contentAccessResolvers} from "./resolvers/contentAccessResolvers";
import {contentModificationResolvers} from "./resolvers/contentModificationResolvers";
import {imageResolvers} from "./resolvers/imageResolvers";
import {moderatorResolvers} from "./resolvers/moderatorResolvers";

export type genericContext = {
    user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any
}

export const resolvers = {
    Query: Object.assign(moderatorResolvers.Query, verificationResolvers.Query, userResolvers.Query,contentAccessResolvers.Query, imageResolvers.Query),
    Mutation: Object.assign(moderatorResolvers.Mutation, verificationResolvers.Mutation, userResolvers.Mutation,contentModificationResolvers.Mutation, contentAccessResolvers.Mutation, imageResolvers.Mutation)
};

