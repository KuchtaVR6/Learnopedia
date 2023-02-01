import {ParagraphInput} from "../../../../models/backEnd/lessonParts/LessonPartManager";
import {genericContext} from "../resolvers";
import prisma from "../../../../prisma/prisma";
import {AmendmentOutput} from "../../../../models/backEnd/amendments/Amendment";
import AmendmentManager from "../../../../models/backEnd/amendments/AmendmentManager";
import {enforceUser} from "./verificationResolvers";
import ContentManager from "../../../../models/backEnd/contents/ContentManager";
import {UserManager} from "../../../../models/backEnd/managers/UserManager";
import MailManager from "../../../../models/backEnd/managers/MailManager";

export const moderatorResolvers = {
    Query: {
        MODERATOR_fetchReported: async (parent: undefined, args: undefined, context: genericContext) => {
            let user = await enforceUser(context)

            if (user.getIsModerator()) {

                let reported = await prisma.amendmentopinion.findMany({
                    where: {
                        report: true
                    },
                })

                let results: AmendmentOutput[] = [];

                //  reverse() so that newest appear first
                for (let content of reported.reverse()) {
                    results.push(
                        await (
                            await
                                AmendmentManager.getInstance().retrieveSpecific(
                                    content.amendmentID
                                )).getFullAmendmentOutput())
                }

                return results;
            } else {
                throw new Error("This action is restricted to Moderators.")
            }
        },
    },
    Mutation: {
        MODERATOR_hideContent: async (parent: undefined, args: { contentID: number }, context: genericContext) => {
            let user = await enforceUser(context)

            let content = await ContentManager.getInstance().getContentByID(args.contentID)

            if (user.getIsModerator()) {
                if (content) {
                    await content.hide()

                    return {
                        continue: true
                    }
                } else {
                    throw new Error("Content not found.")
                }

            } else {
                throw new Error("This action is restricted to Moderators.")
            }
        },
        MODERATOR_suspendUser: async (parent: undefined, args: { userNickname : string, suspensionLift : string, reason : string }, context: genericContext) => {
            let user = await enforceUser(context)

            if (user.getIsModerator()) {
                let affectedUser = await UserManager.getInstance().getUser(args.userNickname)
                await affectedUser.setSuspended(new Date(args.suspensionLift));
                await MailManager.getInstance().suspendUser(affectedUser, args.suspensionLift, args.reason)
            } else {
                throw new Error("This action is restricted to Moderators.")
            }
        },
    }
}