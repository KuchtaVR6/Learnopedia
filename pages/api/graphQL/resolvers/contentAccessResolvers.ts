import KeywordManager from "../../../../models/backEnd/contents/keywords/KeywordManager";
import {genericContext} from "../resolvers";
import ContentManager from "../../../../models/backEnd/contents/ContentManager";
import {FullOutput, LDNJSON, MetaOutput} from "../../../../models/backEnd/contents/Content";

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
        }
    }
}