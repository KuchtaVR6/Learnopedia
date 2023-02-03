import KeywordManager from "../../../../models/backEnd/contents/keywords/KeywordManager";
import {genericContext} from "../resolvers";
import ContentManager from "../../../../models/backEnd/contents/ContentManager";
import {FullOutput, MetaOutput} from "../../../../models/backEnd/contents/Content";
import {AmendmentOutput, VotingSupport} from "../../../../models/backEnd/amendments/Amendment";
import {User} from "../../../../models/backEnd/User";
import {UserManager} from "../../../../models/backEnd/managers/UserManager";
import {enforceUser} from "./verificationResolvers";
import BookmarkManager from "../../../../models/backEnd/managers/BookmarkManager";

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
            }
        },

        getRecommended: async (parent: undefined, args: {loggedIn? : boolean}, context: genericContext): Promise<MetaOutput[]> => {

            let recommendation = await ContentManager.getInstance().getRecommendedMetas();

            if(args.loggedIn) {
                let user = await enforceUser(context)

                let bookmarks = await user.getBookmarkedContent()

                return [...bookmarks, ...recommendation];
            }

            return recommendation;
        },

        getUsersAmendments: async (parent: undefined, args: { nickname?: string }, context: genericContext): Promise<AmendmentOutput[]> => {
            let x: User;

            if (args.nickname) {
                x = await UserManager.getInstance().getUser(args.nickname)
            } else {
                x = await enforceUser(context);
            }

            return await x.getAmendments();
        },

        getContentAmendments: async (parent: undefined, args: { id: number }, context: genericContext): Promise<AmendmentOutput[]> => {
            let content = await ContentManager.getInstance().getSpecificByID(args.id)

            return content.getAmendmentsOutput();
        },

        checkAmendmentVotes: async (parent: undefined, args: { amendmentIds: number[] }, context: genericContext): Promise<VotingSupport[]> => {
            let user = await enforceUser(context)

            return await user.getVoteData(args.amendmentIds);
        }

    },
    Mutation: {
        vote: async (parent: undefined, args: { contentID: number, positive: boolean }, context: genericContext) => {
            let thisUser = await enforceUser(context);

            let content = await ContentManager.getInstance().getSpecificByID(args.contentID)

            await content.vote(thisUser, args.positive)

            return {
                continue: true
            }
        },

        countMyView: async (parent: undefined, args: { id: number, loggedIn : boolean }, context: genericContext) => {
            let myContent = await ContentManager.getInstance().getSpecificByID(args.id)

            myContent.view()

            if(args.loggedIn) {

                let user = await enforceUser(context)

                let voteUninterpreted = user.checkOpinion(args.id);
                let checkBookmark = user.checkBookmark(args.id)

                let vote;

                if(voteUninterpreted==1)
                {
                    vote = true
                }
                else if(voteUninterpreted==0)
                {
                    vote = false
                }
                else{
                    vote = null
                }

                return {
                    vote : vote,
                    bookmark : checkBookmark.reminder,
                    reminderDate : checkBookmark.reminderDate
                }

            }

            return {}

        },

        deleteBookmark: async (parent: undefined, args: { contentID: number }, context: genericContext) => {
            let thisUser = await enforceUser(context);

            let content = await ContentManager.getInstance().getSpecificByID(args.contentID)

            let bookmarkManager = await BookmarkManager.getInstance();

            await bookmarkManager.pushBookmark(thisUser, content.getID(), {delete : true})

            return {
                continue: true
            }
        },

        appendBookmark: async (parent: undefined, args: { contentID: number, reminderDate? : string }, context: genericContext) => {
            let thisUser = await enforceUser(context);

            let content = await ContentManager.getInstance().getSpecificByID(args.contentID)

            let bookmarkManager = await BookmarkManager.getInstance();

            await bookmarkManager.pushBookmark(thisUser, content.getID(), {delete : false, add : args.reminderDate? new Date(args.reminderDate) : true})

            return {
                continue: true
            }
        }
    }
}