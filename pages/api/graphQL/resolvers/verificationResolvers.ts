import {AuthenticationError} from "apollo-server-micro";
import {User} from "../../../../models/backEnd/User";
import {resolveUser} from "../../graphql";
import {SessionRegistry} from "../../../../models/backEnd/managers/SessionRegistry";
import {UserManager} from "../../../../models/backEnd/managers/UserManager";
import MailManager, {ActionType} from "../../../../models/backEnd/managers/MailManager";
import {UserNotFoundException, UserRobot} from "../../../../models/backEnd/tools/Errors";

//function that will check if the user has been found and if not will attempt at refreshing the token and accessing them again
export const enforceUser = async (context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
    if (context.user) {
        return context.user;
    }
    const newAccessToken = await (await SessionRegistry.getInstance()).accessTokenRequest(context.refreshToken, context.agent);

    const newUser = await resolveUser(newAccessToken, context.agent)
    if (newUser) {
        context.setCookies.push({
            name: "accessToken",
            value: newAccessToken,
            options: {
                httpOnly: true,
                sameSite: 'none',
                secure: true
            }
        });
        return newUser
    }

    throw new AuthenticationError("Refresh Token is Invalid");
}

export const verificationResolvers = {
    Query: {
        logout: async (parent: undefined, args: any, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            await (await SessionRegistry.getInstance()).removeSession(context.refreshToken)
            return {
                authorisation: true
            }
        }
    },

    Mutation: {
        login: async (parent: undefined, args: { login: string, password: string }, context: { user: User, agent: string, response: any, setCookies: any, setHeaders: any }) => {
            let consideredUser: User;
            try {
                consideredUser = await UserManager.getInstance().getUser(args.login)
            } catch (e: any) {
                throw new AuthenticationError("Email/nickname is incorrect");
            }

            let result = await consideredUser.checkCredentials(args.login, args.password)

            if (result) {
                let refreshToken = await (await SessionRegistry.getInstance()).addSession(consideredUser, context.agent);
                context.setCookies.push({
                    name: "refreshToken",
                    value: refreshToken,
                    options: {
                        httpOnly: true,
                        sameSite: 'none',
                        secure: true
                    }
                });

                return {
                    authorisation: true
                }

            } else {
                throw new AuthenticationError("Password is incorrect");
            }
        },
        requestAccessToken: async (parent: undefined, args: { RefreshToken: string }, context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let accessToken : string;
            accessToken = await (await SessionRegistry.getInstance()).accessTokenRequest(context.refreshToken, context.agent)


            context.setCookies.push({
                name: "accessToken",
                value: accessToken,
                options: {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true
                }
            });
            return {
                authorisation: true
            }
        },
        forgotPassword: async (parent: undefined,
                       args: { email: string, captchaToken : string },
                       context: { user: User, agent: string, refreshToken: string, initialToken: string, response: any, setCookies: any, setHeaders: any }) => {

            let data = {
                secret: process.env.NODE_ENV === "production"? process.env["CAPTCHA_SECRET"] : process.env["CAPTCHA_SECRET_TEST"],
                response: args.captchaToken
            }


            let response = await fetch("https://hcaptcha.com/siteverify",
                {
                    method: 'POST',
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `secret=${data.secret}&response=${data.response}`
                })

            let response_json = JSON.parse(await response.text())
            let success = response_json['success']

            if (success) {
                let user = await UserManager.getInstance().getUser(args.email)

                if (user) {
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

                    await MailManager.getInstance().unverifiedRequest(ActionType.FORGOT_PASSWORD, async () => {
                        return user
                    }, user.getFName(), user.getLName(), args.email, user.getNickname(), initialToken)
                } else {
                    throw UserNotFoundException
                }
            }
            else {
                throw UserRobot
            }
        },


        verifyCode: async (parent: undefined,
                           args: { code: number },
                           context: { user: User, agent: string, refreshToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let thisUser = await enforceUser(context)
            return {
                authorisation: MailManager.getInstance().verifyAction(thisUser, args.code)
            }
        },

        verifyCodeUnverified: async (parent: undefined,
                                     args: { code: number },
                                     context: { user: User, agent: string, refreshToken: string, initialToken: string, response: any, setCookies: any, setHeaders: any }) => {
            let user = await MailManager.getInstance().verifyUnverified(context.initialToken, args.code)
            let refreshToken = await (await SessionRegistry.getInstance()).addSession(user, context.agent);
            context.setCookies.push({
                name: "refreshToken",
                value: refreshToken,
                options: {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true
                }
            });

            return {
                authorisation: true
            }
        }
    },
};

