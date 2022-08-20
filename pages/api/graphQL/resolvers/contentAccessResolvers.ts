import KeywordManager from "../../../../models/backEnd/contents/keywords/KeywordManager";
import {genericContext} from "../resolvers";
import ContentManager from "../../../../models/backEnd/contents/ContentManager";
import Content, {FullOutput, LDNJSON, MetaOutput} from "../../../../models/backEnd/contents/Content";
import {AmendmentOutput} from "../../../../models/backEnd/amendments/Amendment";
import {User} from "../../../../models/backEnd/User";
import {UserManager} from "../../../../models/backEnd/managers/UserManager";
import {enforceUser} from "./verificationResolvers";

export const contentAccessResolvers = {
    Query: {
        search: async (parent: undefined, args: { query: string }, context: genericContext): Promise<{ score: number, content: MetaOutput }[]> => {
            let manager = await KeywordManager.getInstance()

            return await manager.resolveSearch(args.query.toLowerCase())
        },
        view: async (parent: undefined, args: { id: number }, context: genericContext):
            Promise<{
                mainMeta: MetaOutput,
                output: FullOutput
            }> => {

            let myContent = await ContentManager.getInstance().getSpecificByID(args.id)

            return {
                mainMeta: await myContent.getMeta(),
                output: await myContent.fullRead()
            };
        },
        getRecommended: async (parent: undefined, args: any, context: genericContext): Promise<MetaOutput[]> => {
            return await ContentManager.getInstance().getRecommendedMetas();
        },
        getUsersAmendments: async (parent : undefined, args : { nickname? : string }, context : genericContext): Promise<AmendmentOutput[]> => {
            let x : User;

            if(args.nickname)
            {
                x = await UserManager.getInstance().getUser(args.nickname)
            }
            else{
                x = await enforceUser(context);
            }

            return await x.getAmendments();
        },
        getContentAmendments: async (parent : undefined, args : {id : number}, context : genericContext) : Promise<AmendmentOutput[]> => {
            let content = await ContentManager.getInstance().getSpecificByID(args.id)

            return content.getAmendmentsOutput();
        }
    }
}