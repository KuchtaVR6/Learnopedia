import {User} from "../../../../models/backEnd/User";
import {enforceUser} from "./verificationResolvers";
import KeywordManager from "../../../../models/backEnd/contents/keywords/KeywordManager";
import ContentManager from "../../../../models/backEnd/contents/ContentManager";
import Keyword from "../../../../models/backEnd/contents/keywords/Keyword";
import {lessonPartTypes} from "../../../../models/backEnd/lessonParts/LessonPartManager";
import {genericContext} from "../resolvers";
import {ParagraphOutput} from "../../../../models/backEnd/lessonParts/Paragraph";

export const contentModificationResolvers = {
    Mutation: {
        creationAmendment: async (parent: undefined, args: { name: string, description: string, keywords: { word: string, Score: number }[], seqNumber: number, type: number, parentID?: number }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)

            let manager = await KeywordManager.getInstance()

            await ContentManager.getInstance().createCreationAmendment(thisUser.getID(), args.name, args.description, await manager.createKeywords(args.keywords), args.seqNumber, args.type, args.parentID)
            return {continue: true}
        },
        metaAmendment: async (parent: undefined, args: { targetID: number, changes: { newName?: string, newDescription?: string, addedKeywords?: { word: string, Score: number }[], deletedKeywordIDs?: number[] } }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)

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
            return {continue: true}
        },
        adoptionAmendment: async (parent: undefined, args: { targetID: number, newParent: number }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)

            await ContentManager.getInstance().createAdoptionAmendment(thisUser.getID(), args.targetID, args.newParent)
            return {continue: true}
        },
        listAmendment: async (parent: undefined, args: { targetID: number, changes: { ChildID: number, newSeqNumber?: number, delete: boolean }[] }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)

            await ContentManager.getInstance().createListAmendment(thisUser.getID(), args.targetID, args.changes)

            return {continue: true}
        },
        createParagraph: async (parent: undefined, args: { targetID: number, seqNumber: number, args: ParagraphOutput }, context: genericContext) => {
            let thisUser = await enforceUser(context)

            await ContentManager.getInstance().createPartInsertAmendment(thisUser.getID(), args.targetID, args.seqNumber, {
                moveExisting: false,
                newArgs: {type: lessonPartTypes.PARAGRAPH, content: args.args}
            })

            return {continue: true}
        },
        insertPart: async (parent: undefined, args: { targetID: number, seqNumber: number, oldID : number }, context: genericContext) => {
            let thisUser = await enforceUser(context)

            await ContentManager.getInstance().createPartInsertAmendment(thisUser.getID(), args.targetID, args.seqNumber, {
                moveExisting: true,
                oldID : args.oldID
            })

            return {continue: true}
        },
        deletePart: async (parent: undefined, args: { targetID: number, oldID : number }, context: genericContext) => {
            let thisUser = await enforceUser(context)

            await ContentManager.getInstance().createPartDeletionAmendment(thisUser.getID(), args.targetID, args.oldID)

            return {continue: true}
        },
        modifyToParagraph: async (parent: undefined, args: { targetID: number, oldID : number, args : ParagraphOutput }, context: genericContext) => {
            let thisUser = await enforceUser(context)

            await ContentManager.getInstance().createPartModificationAmendment(thisUser.getID(), args.targetID, args.oldID, {
                type : lessonPartTypes.PARAGRAPH,
                content : args.args
            })

            return {continue: true}
        }
    }
}