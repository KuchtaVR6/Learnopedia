import {genericContext} from "../resolvers";
import {enforceUser} from "./verificationResolvers";

export const imageResolvers = {
    Query: {
        avatarAuthorise : async (parent : undefined, args : undefined, context: genericContext) => {
            let thisUser = await enforceUser(context)

            return { file : thisUser.getAvatarPath() }
        }
    },
    Mutation : {

    }
}