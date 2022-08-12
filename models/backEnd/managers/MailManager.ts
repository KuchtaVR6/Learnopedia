import * as fs from "fs";
import Handlebars from "handlebars";
import path from "path";
import {UserManager} from "./UserManager";
import SelfPurgingMap from "../tools/SelfPurgingMap";
import {User} from "../User";
import {ActionNotDefined, CodeMismatch} from "../tools/Errors";
import {Expirable} from "../tools/Expirable";

const nodemailer = require("nodemailer");

export default class MailManager {
    private static instance: MailManager;
    private readonly verifyActionTemplateHTML: HandlebarsTemplateDelegate;
    private readonly verifyActionTemplateTEXT: HandlebarsTemplateDelegate;
    private readonly actions: SelfPurgingMap<User, Action>;
    private readonly register: SelfPurgingMap<string, Action>;

    private constructor() {
        if (process.env.NODE_ENV === 'development') {
            this.verifyActionTemplateHTML = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../../../models/emails/verifyAction.hbs')).toString());
            this.verifyActionTemplateTEXT = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../../../models/emails/verifyActionText.hbs')).toString());
        } else {
            this.verifyActionTemplateHTML = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../../models/emails/verifyAction.hbs')).toString());
            this.verifyActionTemplateTEXT = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../../models/emails/verifyActionText.hbs')).toString());
        }
        this.actions = new SelfPurgingMap<User, Action>();
        this.register = new SelfPurgingMap<string, Action>()
    }

    public static getInstance(): MailManager {
        if (!this.instance) {
            this.instance = new MailManager();
        }
        return this.instance;
    }

    private static async send(email: string, html: string, text: string) {

        /*
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: process.env["EMAIL_HOST"],
            service: "gmail",
            port: process.env["EMAIL_PORT"],
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env["EMAIL_USERNAME"], // generated ethereal user
                pass: process.env["EMAIL_PASSWORD"], // generated ethereal password
            },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: 'learnopediaTesting@gmail.com', // sender address
            to: email, // list of receivers
            subject: "Verification Code", // Subject line
            text: text, // plain text body
            html: html, // html body,
            attachments: [{
                filename: 'background.jpeg',
                path: process.cwd() + '/models/emails/images/image-2.jpeg',
                cid: 'background'
            },
                {
                    filename: 'logo.png',
                    path: process.cwd() + '/models/emails/images/image-1.png',
                    cid: 'logo'
                }],
        });
         */

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("email:", text);
    }

    private static generateCode(): number {
        return Math.floor(Math.random() * 89999 + 10000)
    }

    public unverifiedRequest(action: ActionType, actionDefinition: (() => Promise<User>), fname: string, lname: string, emailAddress: string, nickname: string, token: string) {
        let email;
        let text;

        let generatedCode = MailManager.generateCode()

        if (action === ActionType.REGISTER) {
            this.register.set(token, new RegisterAction(actionDefinition, generatedCode, emailAddress, nickname))
        } else {
            this.register.set(token, new Action(actionDefinition, generatedCode))
        }

        if (action === ActionType.REGISTER) {
            email = this.verifyActionTemplateHTML({
                lname: lname,
                fname: fname,
                greeting: "Welcome to your Learnopedia journey...",
                mainMessage: "We are very happy to welcome you to the Learnopedia community. We hope you will have a great time learning and creating courses on our platform.",
                prevAction: "ignore this email.",
                action: "register",
                code: generatedCode,
                register: true
            });
            text = this.verifyActionTemplateTEXT({
                lname: lname,
                fname: fname,
                greeting: "Welcome to your Learnopedia journey...",
                mainMessage: "We are very happy to welcome you to the Learnopedia community. We hope you will have a great time learning and creating courses on our platform.",
                prevAction: "ignore this email.",
                action: "register",
                code: generatedCode,
                register: true
            });
        } else if (action === ActionType.FORGOT_PASSWORD) {
            email = this.verifyActionTemplateHTML({
                lname: lname,
                fname: fname,
                greeting: "Welcome to your Learnopedia journey...",
                mainMessage: "We are send a code for verification purposes following your actions. Please make sure that you never share your code and that you are not performing this action" +
                    "under pressure or have been asked to do it by someone you do not trust, as this action will change your access to the account.",
                prevAction: "ignore this email.",
                action: "forgot password",
                code: generatedCode,
                register: true
            })
            text = this.verifyActionTemplateTEXT({
                lname: lname,
                fname: fname,
                greeting: "We heard that you forgot you password...",
                mainMessage: "We are sending a code for verification purposes following your actions. Please make sure that you never share your code and that you are not performing this action" +
                    "under pressure or have been asked to do it by someone you do not trust, as this action will change your access to the account.",
                prevAction: "ignore this email.",
                action: "forgot password",
                code: generatedCode,
            })
        } else {
            throw ActionNotDefined
        }

        if (email && text) {
            MailManager.send(emailAddress, email, text)
        } else {
            throw ActionNotDefined;
        }
    }

    public verificationRequest(action: ActionType, actionDefinition: (() => Promise<User>), user: User) {

        let email;
        let text;

        let generatedCode = MailManager.generateCode()

        this.actions.set(user, new Action(actionDefinition, generatedCode))

        if (action === ActionType.CHANGE_EMAIL || action === ActionType.CHANGE_PASSWORD || action === ActionType.DELETE_ACCOUNT) {
            let desc;
            let greeting;
            let mainMessage = "We are sending a code for verification purposes following your actions. Please make sure that you never share your code and that you are not performing this action" +
                "under pressure or have been asked to do it by someone you do not trust, as this action will change your access to the account.";
            let prevAction = "change your password immediately!";

            switch (action) {
                case ActionType.CHANGE_EMAIL: {
                    desc = "change email"
                    greeting = "We heard that you want to change your email..."
                    break
                }
                case ActionType.CHANGE_PASSWORD: {
                    desc = "change password"
                    greeting = "We heard that you want to change your password..."
                    break
                }
                case ActionType.DELETE_ACCOUNT: {
                    desc = "delete account"
                    greeting = "We are very sad to see you go..."
                    break
                }
            }

            email = this.verifyActionTemplateHTML({
                lname: user.getLName(),
                fname: user.getFName(),
                greeting: greeting,
                mainMessage: mainMessage,
                prevAction: prevAction,
                action: desc,
                code: generatedCode
            });
            text = this.verifyActionTemplateTEXT({
                lname: user.getLName(),
                fname: user.getFName(),
                greeting: greeting,
                mainMessage: mainMessage,
                prevAction: prevAction,
                action: desc,
                code: generatedCode
            });
        } else {
            throw ActionNotDefined
        }

        if (email && text) {
            MailManager.send(user.getEmail(), email, text)
        } else {
            throw ActionNotDefined;
        }
    }

    public async verifyAction(user: User, code: number): Promise<boolean> {
        let action = this.actions.get(user)

        if (action) {
            let newUser = await action.activate(code)
            if (newUser) {
                this.actions.delete(user)
                return true
            }
        }
        throw new CodeMismatch()
    }

    // for action that don't req login (register and forgot password)
    public async verifyUnverified(token: string, code: number): Promise<User> {

        let action = this.register.get(token)
        if (action) {
            let user = await action.activate(code)
            if (user) {
                this.register.delete(token)
                return user
            }
        }
        throw new CodeMismatch()
    }
}

export class Action extends Expirable {
    private readonly action: (() => Promise<User>);
    private readonly code: number;

    /**
     *
     * @param action - a function that will be called on activation, will return a user.
     * @param code - the number for validation
     */
    public constructor(action: (() => Promise<User>), code: number) {
        super(300); // 5 minutes
        this.action = action;
        this.code = code;
    }

    public activate(code: number): Promise<User> {
        if (this.checkValidity()) {
            if (this.code === code) {
                return this.action()
            }
        }
        throw new CodeMismatch()
    }
}

class RegisterAction extends Action {
    private readonly email: string;
    private readonly nickname: string;

    public constructor(action: (() => Promise<User>), code: number, email: string, nickname: string) {
        super(action, code);
        UserManager.getInstance().reserve(email, nickname)
        this.email = email;
        this.nickname = nickname;
    }

    public onDeath() {
        UserManager.getInstance().release(this.email, this.nickname)
    }
}

export enum ActionType {
    CHANGE_EMAIL,
    CHANGE_PASSWORD,
    DELETE_ACCOUNT,
    REGISTER,
    FORGOT_PASSWORD
}