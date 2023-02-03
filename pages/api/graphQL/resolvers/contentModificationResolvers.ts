import {User} from "../../../../models/backEnd/User";
import {enforceUser} from "./verificationResolvers";
import KeywordManager from "../../../../models/backEnd/contents/keywords/KeywordManager";
import ContentManager from "../../../../models/backEnd/contents/ContentManager";
import Keyword from "../../../../models/backEnd/contents/keywords/Keyword";
import {genericContext} from "../resolvers";
import {AmendmentOpinionValues, VotingSupport} from "../../../../models/backEnd/amendments/Amendment";
import AmendmentManager from "../../../../models/backEnd/amendments/AmendmentManager";
import {InvalidArgument} from "../../../../models/backEnd/tools/Errors";
import {lessonPartTypes} from "../../../../models/backEnd/lessonParts/LessonPartTypes";
import {ParagraphInput} from "../../../../models/backEnd/lessonParts/LessonPartManager";
import {EmbeddableInput} from "../../../../models/backEnd/lessonParts/Embeddable";
import {QuizQuestionInput} from "../../../../models/backEnd/lessonParts/QuizQuestion";

export const contentModificationResolvers = {
    Mutation: {
        creationAmendment: async (parent: undefined, args: { name: string, description: string, keywords: { word: string, Score: number }[], seqNumber: number, type: number, parentID?: number }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)

            let manager = await KeywordManager.getInstance()
            if (thisUser.checkSuspension()) {
                await ContentManager.getInstance().createCreationAmendment(thisUser.getID(), args.name, args.description, await manager.createKeywords(args.keywords), args.seqNumber, args.type, args.parentID)
            } else {
                throw new Error("You have been suspended.")
            }

            return {continue: true}
        },
        metaAmendment: async (parent: undefined, args: { targetID: number, changes: { newName?: string, newDescription?: string, addedKeywords?: { word: string, Score: number }[], deletedKeywordIDs?: number[] } }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)

            if (thisUser.checkSuspension()) {
                let manager = await KeywordManager.getInstance()

                let addedKeywords: Keyword[] | undefined = undefined;
                let deletedKeywords: Keyword[] | undefined = undefined;

                if (args.changes.addedKeywords) {
                    addedKeywords = await manager.createKeywords(args.changes.addedKeywords)
                }

                if (args.changes.deletedKeywordIDs) {
                    deletedKeywords = [];
                    args.changes.deletedKeywordIDs.map((deletedID) => {
                        deletedKeywords!.push(manager.getKeywordByID(deletedID))
                    })
                }

                let providingArgs = {
                    newName: args.changes.newName,
                    newDescription: args.changes.newDescription,
                    addedKeywords: addedKeywords,
                    deletedKeywords: deletedKeywords
                }

                await ContentManager.getInstance().createMetaAmendment(thisUser.getID(), args.targetID, providingArgs)
            } else {
                throw new Error("You have been suspended.")
            }

            return {continue: true}
        },
        adoptionAmendment: async (parent: undefined, args: { targetID: number, newParent: number }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)

            if (thisUser.checkSuspension()) {
                await ContentManager.getInstance().createAdoptionAmendment(thisUser.getID(), args.targetID, args.newParent)
            } else {
                throw new Error("You have been suspended.")
            }
            return {continue: true}
        },
        listAmendment: async (parent: undefined, args: { targetID: number, changes: { ChildID?: number, newSeqNumber?: number, LessonPartID?: number, delete: boolean }[] }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)

            if (thisUser.checkSuspension()) {
                await ContentManager.getInstance().createListAmendment(thisUser.getID(), args.targetID, args.changes)
            } else {
                throw new Error("You have been suspended.")
            }

            return {continue: true}
        },
        createParagraph: async (parent: undefined, args: { targetID: number, seqNumber: number, args: ParagraphInput }, context: genericContext) => {
            let thisUser = await enforceUser(context)

            if (thisUser.checkSuspension()) {
                await ContentManager.getInstance().createAddReplaceAmendment(thisUser.getID(), args.targetID, args.seqNumber, {
                    newArgs: {type: lessonPartTypes.PARAGRAPH, content: args.args}
                })
            } else {
                throw new Error("You have been suspended.")
            }

            return {continue: true}
        },
        modToParagraph: async (parent: undefined, args: { targetID: number, seqNumber: number, oldID: number, args: ParagraphInput }, context: genericContext) => {
            let thisUser = await enforceUser(context)

            if (thisUser.checkSuspension()) {
                await ContentManager.getInstance().createAddReplaceAmendment(thisUser.getID(), args.targetID, args.seqNumber, {
                    newArgs: {type: lessonPartTypes.PARAGRAPH, content: args.args},
                    oldID: args.oldID
                })
            } else {
                throw new Error("You have been suspended.")
            }

            return {continue: true}
        },
        createEmbeddable: async (parent: undefined, args: { targetID: number, seqNumber: number, args: EmbeddableInput }, context: genericContext) => {
            let thisUser = await enforceUser(context)

            if (thisUser.checkSuspension()) {
                if (args.args.localCacheImage) {
                    await thisUser.setUploadCachePath(null);
                    args.args.uri = "/uploads/images/"
                }

                await ContentManager.getInstance().createAddReplaceAmendment(thisUser.getID(), args.targetID, args.seqNumber, {
                    newArgs: {type: lessonPartTypes.EMBEDDABLE, content: args.args}
                })
            } else {
                throw new Error("You have been suspended.")
            }

            return {continue: true}
        },
        modToEmbeddable: async (parent: undefined, args: { targetID: number, seqNumber: number, oldID: number, args: EmbeddableInput }, context: genericContext) => {
            let thisUser = await enforceUser(context)

            if (thisUser.checkSuspension()) {
                await ContentManager.getInstance().createAddReplaceAmendment(thisUser.getID(), args.targetID, args.seqNumber, {
                    newArgs: {type: lessonPartTypes.EMBEDDABLE, content: args.args},
                    oldID: args.oldID
                })
            } else {
                throw new Error("You have been suspended.")
            }

            return {continue: true}
        },
        createQuizQuestion: async (parent: undefined, args: { targetID: number, seqNumber: number, args: QuizQuestionInput }, context: genericContext) => {
            let thisUser = await enforceUser(context)

            if (thisUser.checkSuspension()) {
                await ContentManager.getInstance().createAddReplaceAmendment(thisUser.getID(), args.targetID, args.seqNumber, {
                    newArgs: {type: lessonPartTypes.QUIZ_QUESTION, content: args.args}
                })
            } else {
                throw new Error("You have been suspended.")
            }

            return {continue: true}
        },
        modToQuizQuestion: async (parent: undefined, args: { targetID: number, seqNumber: number, oldID: number, args: QuizQuestionInput }, context: genericContext) => {

            let thisUser = await enforceUser(context)

            if (thisUser.checkSuspension()) {
                await ContentManager.getInstance().createAddReplaceAmendment(thisUser.getID(), args.targetID, args.seqNumber, {
                    newArgs: {type: lessonPartTypes.QUIZ_QUESTION, content: args.args},
                    oldID: args.oldID
                })
            } else {
                throw new Error("You have been suspended.")
            }

            return {continue: true}
        },
        voteOnAmendment: async (
            parent: undefined,
            args: { amendmentID: number, positive?: boolean, negative?: boolean, report?: boolean },
            context: genericContext
        ): Promise<VotingSupport> => {
            let user = await enforceUser(context)
            let amendment = await AmendmentManager.getInstance().retrieve(args.amendmentID)

            let vote: AmendmentOpinionValues;

            if (args.positive) {
                vote = AmendmentOpinionValues.Positive
            } else if (args.negative) {
                vote = AmendmentOpinionValues.Negative
            } else if (args.report) {
                vote = AmendmentOpinionValues.Report
            } else {
                throw InvalidArgument
            }

            await amendment.vote(user, vote)

            return await amendment.checkFulfillmentAndReturn()
        }

    }
}