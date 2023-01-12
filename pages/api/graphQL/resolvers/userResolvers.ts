import {User} from "../../../../models/backEnd/User";
import {enforceUser} from "./verificationResolvers";
import {UserInputError} from "apollo-server-micro";
import {UserManager} from "../../../../models/backEnd/managers/UserManager";
import {SessionRegistry} from "../../../../models/backEnd/managers/SessionRegistry";
import MailManager, {ActionType} from "../../../../models/backEnd/managers/MailManager";
import {UserRobot} from "../../../../models/backEnd/tools/Errors";

export const userResolvers = {
    Query: {
        getUser: async (parent: undefined, args: { nickname?: string }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser;
            if (args.nickname) {
                thisUser = await UserManager.getInstance().getUser(args.nickname)
            } else {
                thisUser = await enforceUser(context);
            }
            return thisUser.getAllDetails()
        },
        vacantEmail: async (parent: undefined, args: { email: string }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            return {
                query: args.email,
                vacant: await UserManager.getInstance().validateEmail(args.email)
            }
        },
        vacantNickname: async (parent: undefined, args: { nickname: string }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            return {
                query: args.nickname,
                vacant: await UserManager.getInstance().validateNickname(args.nickname)
            }
        }
    },
    Mutation: {
        addUser: async (parent: undefined, args: { nickname: string, email: string, fname: string, lname: string, password: string, captchaToken: string }, context: { user: User, agent: string, refreshToken: string, initialToken: string, response: any, setCookies: any, setHeaders: any }) => {

            let data = {
                secret: process.env.NODE_ENV === "production" ? process.env.CAPTCHA_SECRET : process.env.CAPTCHA_SECRET_TEST,
                response: args.captchaToken
            }

            let response = await fetch("https://hcaptcha.com/siteverify",
                {
                    method: 'POST',
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    body: `secret=${data.secret}&response=${data.response}`
                })

            let response_json = JSON.parse(await response.text())
            let success = response_json['success']
            if (success) {
                if (args.email && args.nickname && args.lname && args.fname && args.password) {
                    if ((await UserManager.getInstance().validateEmail(args.email)) && (await UserManager.getInstance().validateNickname(args.nickname))) {
                        if (UserManager.getInstance().validatePassword(args.password)) {
                            let initialToken;
                            if (!context.initialToken) {
                                initialToken = SessionRegistry.generateToken(8);
                                context.setCookies.push({
                                    name: "initialToken",
                                    value: initialToken,
                                    options: {
                                        httpOnly: true,
                                        sameSite: 'none',
                                        secure: true
                                    }
                                });
                            } else {
                                initialToken = context.initialToken
                            }

                            MailManager.getInstance().unverifiedRequest(ActionType.REGISTER, async () => {
                                return await UserManager.getInstance().addUser(args.nickname, args.email, args.fname, args.lname, args.password);
                            }, args.fname, args.lname, args.email, args.nickname, initialToken);

                            return {
                                continue: true
                            }
                        }
                    }
                }
                throw UserInputError
            }
            throw UserRobot
        },

        modifyUser: async (parent: undefined,
                           args: { nickname: string | undefined, lname: string | undefined, fname: string | undefined, colorA: string | undefined, colorB: string | undefined },
                           context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)

            if (args.nickname) {
                await thisUser.setNickname(args.nickname)
            }

            if (args.fname) {
                await thisUser.setFname(args.fname)
            }

            if (args.lname) {
                await thisUser.setLname(args.lname)
            }

            if (args.colorA) {
                await thisUser.setColorA(args.colorA)
            }

            if (args.colorB) {
                await thisUser.setColorB(args.colorB)
            }

            await thisUser.updateManager()

            return thisUser;
        },

        changeEmail: async (parent: undefined,
                            args: { email: string },
                            context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)
            MailManager.getInstance().verificationRequest(ActionType.CHANGE_EMAIL, async () => {
                thisUser.setEmail(args.email);
                return thisUser;
            }, thisUser)
            return {
                continue: true
            }
        },

        changePassword: async (parent: undefined,
                               args: { password: string },
                               context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)
            MailManager.getInstance().verificationRequest(ActionType.CHANGE_PASSWORD, async () => {
                thisUser.setPassword(args.password);
                return thisUser;
            }, thisUser)
            return {
                continue: true
            }
        },

        deleteUser: async (parent: undefined,
                           args: { password: string },
                           context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)
            MailManager.getInstance().verificationRequest(ActionType.DELETE_ACCOUNT, async () => {
                UserManager.getInstance().deleteUser(thisUser);
                (await SessionRegistry.getInstance()).removeSession(context.refreshToken);
                return thisUser
            }, thisUser)
            return {
                continue: true
            }
        },
    }
}