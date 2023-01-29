import prisma from "../../../prisma/prisma";
import MailManager from "./MailManager";
import {UserManager} from "./UserManager";
import ContentManager from "../contents/ContentManager";
import { bookmarks } from "@prisma/client";
import {User} from "../User";

class BookmarkManager {
    private static instance: BookmarkManager | undefined;
    private nextFetch : Date;
    private fetchTimeout : NodeJS.Timeout | undefined;

    /* in minutes */
    private fetchDelay = 60;

    private constructor() {
        this.nextFetch = new Date();
    }

    private async handleReminder(row : bookmarks) {
        if(row.reminderTimestamp && !row.reminded) {
            let currentTime = new Date();
            if (row.reminderTimestamp > currentTime) {
                setTimeout(
                    async () => {
                        let bookmark = await prisma.bookmarks.findUnique({
                            where : {
                                userID_contentID : {
                                    userID : row.userID,
                                    contentID : row.contentID
                                }
                            }
                        })
                        if(bookmark && !bookmark.reminded) {
                            await MailManager.getInstance().bookmarkReminder(await UserManager.getInstance().getUserID(row.userID), await ContentManager.getInstance().getContentByID(row.contentID))
                            await prisma.bookmarks.update({
                                where: {
                                    userID_contentID: {
                                        userID: row.userID,
                                        contentID: row.contentID
                                    }
                                },
                                data: {
                                    reminded: true
                                }
                            })
                        }
                    }, row.reminderTimestamp.getTime() - currentTime.getTime())
            }
            else {
                await MailManager.getInstance().bookmarkReminder(await UserManager.getInstance().getUserID(row.userID), await ContentManager.getInstance().getContentByID(row.contentID))
                await prisma.bookmarks.update({
                    where : {
                        userID_contentID : {
                            userID : row.userID,
                            contentID : row.contentID
                        }
                    },
                    data : {
                        reminded: true
                    }
                })
            }
        }
    }

    private async fetchDatabase() {
        if(this.nextFetch <= new Date()) {
            this.fetchTimeout = undefined;
            this.nextFetch = new Date(new Date().getTime() + this.fetchDelay * 60 * 1000);
            let output = await prisma.bookmarks.findMany();
            for (let row of output) {
                if (row.reminderTimestamp && !row.reminded) {
                    if (this.nextFetch > row.reminderTimestamp) {
                        await this.handleReminder(row)
                    }
                }
            }
            this.fetchTimeout = setTimeout(() => {
                this.fetchDatabase()
            }, (new Date()).getTime() - this.nextFetch.getTime())
        }
    }

    public async pushBookmark(user : User, contentId : number, options : { delete: true; } | { add: true | Date; delete: false; }) {
        let output = await user.pushBookmark(contentId,options)

        console.log(user)

        if(output && !options.delete) {
            if (output.reminderTimestamp && !output.reminded) {
                if (this.nextFetch > output.reminderTimestamp) {
                    await this.handleReminder(output)
                }
            }
        }
    }

    public static async getInstance() {
        if (!this.instance) {
            this.instance = new BookmarkManager();
            await this.instance.fetchDatabase();
        }
        return this.instance;
    }
}

export default BookmarkManager;