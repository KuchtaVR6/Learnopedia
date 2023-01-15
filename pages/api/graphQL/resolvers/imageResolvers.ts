import {genericContext} from "../resolvers";
import {enforceUser} from "./verificationResolvers";
import fs from "fs";
import avatar from "../../upload/avatar";

const deleteFile = (fileToDelete: string | null, folder: string) => {

    if (fileToDelete && fileToDelete.length > 1) {
        let finalPath = "./public/uploads/" + folder + "/" + fileToDelete
        if (finalPath.split("/").length === 5) {
            try{
                fs.unlinkSync(finalPath)
            }
            catch (e)
            {
                console.log("FILE DELETION FAILED", finalPath, e)
            }
        }
    }
}

export const imageResolvers = {
    Query: {
        avatarAuthorise : async (parent : undefined, args : undefined, context: genericContext) => {
            let thisUser = await enforceUser(context)

            let file = thisUser.getAvatarPath()

            deleteFile(file, "avatars")

            return { file :  file }
        }
    },
    Mutation : {
        avatarFinalise : async (parent : undefined, args : {newPath : string}, context: genericContext) => {

            let thisUser = await enforceUser(context)

            await thisUser.setAvatarPath(args.newPath)

            return {
                continue : true
            }
        }
    }
}