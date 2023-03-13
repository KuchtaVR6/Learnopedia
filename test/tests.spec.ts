import {assert, expect} from 'chai';
import {User} from "../models/backEnd/User";
import {UserManager} from "../models/backEnd/managers/UserManager";
import Amendment, {AmendmentOpinionValues} from "../models/backEnd/amendments/Amendment";
import AmendmentManager from "../models/backEnd/amendments/AmendmentManager";
import ContentManager from "../models/backEnd/contents/ContentManager";
import KeywordManager from "../models/backEnd/contents/keywords/KeywordManager";
import Content, {ContentType} from "../models/backEnd/contents/Content";
import {SessionRegistry} from "../models/backEnd/managers/SessionRegistry";
import MailManager, {ActionType} from "../models/backEnd/managers/MailManager";
import BookmarkManager from "../models/backEnd/managers/BookmarkManager";
import Keyword, {ActiveKeyword} from "../models/backEnd/contents/keywords/Keyword";
import Chapter from "../models/backEnd/contents/Chapter";
import {lessonPartTypes} from "../models/backEnd/lessonParts/LessonPartTypes";
import {Course} from "../models/backEnd/contents/Course";
import Lesson from "../models/backEnd/contents/Lesson";
import {Expirable} from "../models/backEnd/tools/Expirable";
import {
    ActionNotDefined,
    CodeMismatch,
    ContentNeedsParent,
    ContentNotFetched,
    ContentNotNavigable,
    EmptyModification,
    LegacyAmendment,
    MissingLessonPart,
    NoChanges,
    UnsupportedOperation,
    UserRobot
} from "../models/backEnd/tools/Errors";
import SelfPurgingMap, {Purgeable} from "../models/backEnd/tools/SelfPurgingMap";
import {Embeddable} from "../models/backEnd/lessonParts/Embeddable";
import {QuizQuestion} from "../models/backEnd/lessonParts/QuizQuestion";
import LessonPartManager from "../models/backEnd/lessonParts/LessonPartManager";

/**
 * Branches infeasible to cover:
 *
 * 1. Passwords get hashed without the User awaiting them to get hashed (responsiveness), as such for a
 * very limited time the user has no password associated, and all login would be rejected. Such request is
 * theoretically possible, but I couldn't reproduce it as such those branches have been excluded.
 *
 * 2. The testing is with regard to production version as such these lines have been excluded from the count
 *
 * 3. The greeting? That is completely random! If its broken that only makes it more random :)
 *
 * 4. Over-depended on time, the super class method being called test with all the subcomponents as well.
 *
 * 5. Basically impossible due to the avoidance of collisions for seqNumbers.
 */

let user: User;
let nickname = String(new Date().getTime())
let email = nickname + "@email.com"
let rf = ""
let at = ""

let resultContent: Course;
let created: Amendment[] = [];

describe('Model testing', function () {
        describe('1. User', () => {
            it('1. Constructing', async () => {
                let manager = await UserManager.getInstance()

                user = await manager.addUser(nickname, email, "testFname", "testLname", "testPassword123");

                user = await UserManager.getInstance().getUserID(user.getID())

                expect(await user.getAllDetails()).to.deep.include({nickname: nickname, email: email})
            });
            it('2. Set Nickname', async () => {

                let newNickname = String(new Date().getTime() + 10000)
                await user.setNickname(newNickname)

                await user.updateManager()

                expect(user.getNickname()).to.equal(newNickname)
            });
            it('3. Set Email', async () => {

                let newEmail = String(new Date().getTime()) + "@email.com"
                await user.setEmail(newEmail)

                await user.updateManager()

                expect(user.getEmail()).to.equal(newEmail)
            });
            describe('4. Password', () => {
                it('1. Set Password & checkCredentials', async () => {

                    let newPassword = "testPassword1234"
                    await user.setPassword(newPassword)

                    expect(await user.checkCredentials(user.getNickname(), newPassword)).to.equal(true)
                    expect(await user.checkCredentials(user.getNickname(), newPassword + " ")).to.equal(false)
                    expect(await user.checkCredentials(user.getNickname() + " ", newPassword)).to.equal(false)
                });
                it('2. No mix of cases', async () => {
                    let newPassword = "dsadasdasdas12321"
                    try {
                        await user.setPassword(newPassword)
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(1).to.equal(1)
                    }
                });
                it('3. No letters', async () => {

                    let newPassword = "123123123121"
                    try {
                        await user.setPassword(newPassword)
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(1).to.equal(1)
                    }
                });
                it('4. No numbers', async () => {

                    let newPassword = "Ddasdasdas"
                    try {
                        await user.setPassword(newPassword)
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(1).to.equal(1)
                    }
                });
                it('5. Too short', async () => {

                    let newPassword = "Aa3"
                    try {
                        await user.setPassword(newPassword)
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(1).to.equal(1)
                    }
                });
                it('6. Too Long', async () => {

                    let newPassword = "Aa1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
                    try {
                        await user.setPassword(newPassword)
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(1).to.equal(1)
                    }
                });
            })
            describe('5. Opinion', () => {
                it('1. Add opinion true', async () => {

                    let ans = user.changeOpinion(10, true)

                    expect(ans).to.equal(1)
                    expect(user.checkOpinion(10)).to.equal(1)
                });
                it('2. Add opinion false', async () => {

                    let ans = user.changeOpinion(12, false)

                    expect(ans).to.equal(1)
                    expect(user.checkOpinion(12)).to.equal(0)
                });
                it('3. Change Opinion to false', async () => {

                    let ans = user.changeOpinion(10, false)

                    expect(ans).to.equal(0)
                    expect(user.checkOpinion(10)).to.equal(0)
                });
                it('4. Change Opinion to true', async () => {

                    let ans = user.changeOpinion(12, true)

                    expect(ans).to.equal(0)
                    expect(user.checkOpinion(12)).to.equal(1)
                });
                it('5. Remove false opinion', async () => {

                    let ans = user.changeOpinion(10, false)

                    expect(ans).to.equal(-1)
                    expect(user.checkOpinion(10)).to.equal(-1)
                });
                it('6. Remove true opinion', async () => {

                    let ans = user.changeOpinion(12, true)

                    expect(ans).to.equal(-1)
                    expect(user.checkOpinion(12)).to.equal(-1)
                });
            })
            describe('6. Bookmark', () => {
                it('1. pushBookmark adding', async () => {
                    await user.pushBookmark(10, {add: true, delete: false})

                    expect(user.checkBookmark(10)).to.deep.equal({
                        reminder: true
                    })
                });
                it('2. pushBookmark removing', async () => {
                    await user.pushBookmark(10, {delete: true})

                    expect(user.checkBookmark(10)).to.deep.equal({
                        reminder: false
                    })
                });
                it('3. pushBookmark adding reminder', async () => {

                    let date = "2024.12.20"

                    await user.pushBookmark(12, {add: new Date(date), delete: false})

                    expect(user.checkBookmark(12)).to.deep.equal({
                        reminder: true,
                        reminderDate: date
                    })
                });
                it('4. pushBookmark inserting reminder to existing', async () => {

                    let date = "2020.12.20"

                    await user.pushBookmark(12, {add: new Date(date), delete: false})

                    expect(user.checkBookmark(12)).to.deep.equal({
                        reminder: true
                    })
                });
                it('5. pushBookmark inserting without reminder to existing', async () => {

                    await user.pushBookmark(12, {add: true, delete: false})

                    expect(user.checkBookmark(12)).to.deep.equal({
                        reminder: true
                    })
                });
                it('6. getBookmarkedContent with output', async () => {

                    let output = (await user.getBookmarkedContent()).filter((row) => {
                        return row.id === 12
                    })
                    expect(output.length).to.be.equal(1)
                });
                it('7. getBookmarkedContent without output', async () => {

                    await user.pushBookmark(12, {delete: true})

                    let output = (await user.getBookmarkedContent())
                    expect(output.length).to.be.equal(0)
                });
            })
            describe('7. Votes', () => {
                it('1. Add vote true', async () => {

                    let ans = user.changeVote(10, AmendmentOpinionValues.Positive)

                    expect(ans).to.equal(1)
                    expect(user.checkVote(10)).to.equal(AmendmentOpinionValues.Positive)
                });
                it('2. Add vote false', async () => {

                    let ans = user.changeVote(11, AmendmentOpinionValues.Negative)

                    expect(ans).to.equal(1)
                    expect(user.checkVote(11)).to.equal(AmendmentOpinionValues.Negative)
                });
                it('3. Add vote report', async () => {

                    let ans = user.changeVote(12, AmendmentOpinionValues.Report)

                    expect(ans).to.equal(1)
                    expect(user.checkVote(12)).to.equal(AmendmentOpinionValues.Report)
                });
                it('4. Change vote to true', async () => {

                    let ans = user.changeVote(12, AmendmentOpinionValues.Positive)

                    expect(ans).to.equal(0)
                    expect(user.checkVote(12)).to.equal(AmendmentOpinionValues.Positive)
                });
                it('5. Change vote to report', async () => {

                    let ans = user.changeVote(11, AmendmentOpinionValues.Report)

                    expect(ans).to.equal(0)
                    expect(user.checkVote(11)).to.equal(AmendmentOpinionValues.Report)
                });
                it('6. Change vote to false', async () => {

                    let ans = user.changeVote(10, AmendmentOpinionValues.Negative)

                    expect(ans).to.equal(0)
                    expect(user.checkVote(10)).to.equal(AmendmentOpinionValues.Negative)
                });
                it('7. Remove true vote opinion', async () => {

                    let ans = user.changeVote(12, AmendmentOpinionValues.Positive)

                    expect(ans).to.equal(-1)
                    expect(user.checkVote(12)).to.equal(undefined)
                });
                it('8. Remove false vote opinion', async () => {

                    let ans = user.changeVote(10, AmendmentOpinionValues.Negative)

                    expect(ans).to.equal(-1)
                    expect(user.checkVote(10)).to.equal(undefined)
                });
                it('9. Remove report vote opinion', async () => {

                    let ans = user.changeVote(11, AmendmentOpinionValues.Report)

                    expect(ans).to.equal(-1)
                    expect(user.checkVote(11)).to.equal(undefined)
                });
                it('10. Get vote data', async () => {

                    let amendment = await AmendmentManager.getInstance().retrieve(12)
                    await amendment.vote(user, AmendmentOpinionValues.Positive)

                    let output = (await user.getVoteData([12, 13])).filter((row) => {
                        return row.userOP === 1 && row.amendmentID === 12
                    })

                    expect(output.length).to.be.equal(1)
                });
            })
            it('8. Set Avatar', async () => {
                let path = "dasdas.png";

                await user.setAvatarPath(path)

                expect(user.getAvatarPath()).to.equal(path)
                expect(await user.getAllDetails()).to.include({avatarPath: "/api/images/" + path})

                await user.setAvatarPath(null)

                expect(user.getAvatarPath()).to.equal(null)
                expect(await user.getAllDetails()).to.include({avatarPath: "/images/defProfile.png"})
            })
            describe('9. Amendments', async () => {
                it('1. sample creation amendment', async () => {
                    let manager = await KeywordManager.getInstance()
                    if (user.checkSuspension()) {
                        await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 0, ContentType.COURSE)

                        await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 0, ContentType.CHAPTER, 1)

                        expect((await user.getAmendments()).length).to.be.equal(2)
                    }
                })
                it('2. calculating XP', async () => {
                    let xp = await user.getXP();

                    expect(xp).to.be.equal(0)
                })
            })
            describe('10. Details getters and setters', async () => {
                it('1. set and get lName', async () => {
                    let newLname = "dsasdsa"
                    await user.setLname(newLname)
                    expect(user.getLName()).to.equal(newLname)
                })
                it('2. set and get fName', async () => {
                    let newFname = "dsasdsa"
                    await user.setFname(newFname)
                    expect(user.getFName()).to.equal(newFname)
                })
                it('3. set and get upload cache', async () => {
                    await user.setUploadCachePath("image_12324.png");

                    expect(user.getUploadCachePath()).to.be.equal("image_12324.png")
                })
                it('4. set and get suspension    ', async () => {
                    await user.setSuspended(new Date(new Date().getTime() - 1000000));

                    expect(user.checkSuspension()).to.be.equal(true)

                    await user.setSuspended(new Date(new Date().getTime() + 1000))

                    expect(user.checkSuspension()).to.be.equal(false)
                })
                it('5. get moderator status', async () => {
                    expect(user.getIsModerator()).to.be.equal(false)
                })
                it('6. set and get Colour A', async () => {
                    await user.setColorA("#111111")

                    expect(await user.getAllDetails()).to.include({colorA: "#111111"})
                })
                it('7. set and get Colour B', async () => {
                    await user.setColorB("#111111")

                    expect(await user.getAllDetails()).to.include({colorB: "#111111"})
                })
            })
        })
        describe('2. UserManager', () => {
            it('1. getUser', async () => {
                let user2 = await UserManager.getInstance().getUser(user.getNickname())

                expect(user2).to.deep.include({id: user.getID()})
            })
            it('2. getUser (deletedUser)', async () => {
                let withoutAuthor = await AmendmentManager.getInstance().retrieve(1)

                expect((await withoutAuthor.getAuthor()).getNickname()).to.deep.equal(UserManager.getInstance().deletedUser().getNickname())
            })
            it('3. addUser not unique credentials', async () => {
                try {
                    await UserManager.getInstance().addUser(
                        nickname, email, "testFname", "testLname", "testPassword123")
                    await UserManager.getInstance().addUser(
                        nickname, email, "testFname", "testLname", "testPassword123")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(1).to.equal(1)
                }
            })
            it('4. addUser & delete', async () => {
                let user2 = await UserManager.getInstance().addUser(
                    nickname + "!", email + "!", "testFname", "testLname", "testPassword123")

                await UserManager.getInstance().deleteUser(user2)

                try {
                    let user3 = await UserManager.getInstance().getUser(user.getNickname())
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(1).to.equal(1)
                }
            })
            it('5. validateEmail', async () => {
                let email2 = email + "!"

                expect(await UserManager.getInstance().validateEmail(email2)).to.equal(true)
                expect(await UserManager.getInstance().validateEmail("kuchtavr6@gmail.com")).to.equal(false)
            })
            it('6. validateNickname', async () => {
                let nickname2 = nickname + "!"

                expect(await UserManager.getInstance().validateNickname(nickname2)).to.equal(true)
                expect(await UserManager.getInstance().validateNickname("kuchtavr6")).to.equal(false)
            })
            it('7. reserve', async () => {
                let nickname2 = nickname + "!"
                let email2 = email + "!"
                await UserManager.getInstance().reserve(email2, nickname2)

                expect(await UserManager.getInstance().validateEmail(email2)).to.equal(false)
                expect(await UserManager.getInstance().validateNickname(nickname2)).to.equal(false)

                expect(await UserManager.getInstance().validateEmailRes(email2)).to.equal(true)
                expect(await UserManager.getInstance().validateNicknameRes(nickname2)).to.equal(true)
            })
            it('8. release', async () => {
                let nickname2 = nickname + "!"
                let email2 = email + "!"
                await UserManager.getInstance().release(email2, nickname2)

                expect(await UserManager.getInstance().validateEmail(email2)).to.equal(true)
                expect(await UserManager.getInstance().validateNickname(nickname2)).to.equal(true)

                expect(await UserManager.getInstance().validateEmailRes(email2)).to.equal(true)
                expect(await UserManager.getInstance().validateNicknameRes(nickname2)).to.equal(true)
            })
            describe('9. Password', () => {
                it('1. All good', async () => {
                    let newPassword = "testPassword1234"

                    expect(await UserManager.getInstance().validatePassword(newPassword)).to.equal(true)
                });
                it('2. No mix of cases', async () => {
                    let newPassword = "dsadasdasdas12321"
                    expect(await UserManager.getInstance().validatePassword(newPassword)).to.equal(false)
                });
                it('3. No letters', async () => {

                    let newPassword = "123123123121"
                    expect(await UserManager.getInstance().validatePassword(newPassword)).to.equal(false)
                });
                it('4. No numbers', async () => {

                    let newPassword = "Ddasdasdas"
                    expect(await UserManager.getInstance().validatePassword(newPassword)).to.equal(false)
                });
                it('5. Too short', async () => {

                    let newPassword = "Aa3"
                    expect(await UserManager.getInstance().validatePassword(newPassword)).to.equal(false)
                });
                it('6. Too Long', async () => {

                    let newPassword = "Aa1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
                    expect(await UserManager.getInstance().validatePassword(newPassword)).to.equal(false)
                });
            })
            it('10. getUser (not cached)', async () => {
                let user2 = await UserManager.getInstance().getUser("kuchtavr6")

                expect(user2).to.deep.include({nickname: "kuchtavr6"})
            })
            it('11. getUser (not found)', async () => {

                try {
                    let user2 = await UserManager.getInstance().getUser("h")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(1).to.equal(1)
                }
            })
            it('12. getUserID (not found)', async () => {

                try {
                    let user2 = await UserManager.getInstance().getUserID(1312312312)
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(1).to.equal(1)
                }
            })
            it('13. getUserID (not cached)', async () => {

                let user2 = await UserManager.getInstance().getUserID(5)
                expect(user2).to.deep.include({id: 5})
            })
            it('14. validateEmail wrong Email', async () => {
                let email2 = "sdasdasda"
                expect(await UserManager.getInstance().validateEmail(email2)).to.equal(false)
            })
            it('15. validateNickname wrong Nickname', async () => {
                let nickname = "dsad@dasdas"

                expect(await UserManager.getInstance().validateNickname(nickname)).to.equal(false)
            })
            it('16. validateEmail wrong Email len', async () => {
                let email2 = "@ne"

                expect(await UserManager.getInstance().validateEmail(email2)).to.equal(false)
            })
            it('17. validateNickname wrong Nickname len', async () => {
                let nickname = "tes"

                expect(await UserManager.getInstance().validateNickname(nickname)).to.equal(false)
            })
            it('18. updateIdentifierCaches wrong identifier', async () => {
                let nickname = "tes"

                try {
                    await UserManager.getInstance().updateNick(nickname, "test")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(false).to.equal(false)
                }

            })
            it('19. updateNick wrong identifier', async () => {

                try {
                    await UserManager.getInstance().updateNick(nickname, "tes")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(false).to.equal(false)
                }
            })
            it('20. updateEmail wrong identifier', async () => {

                try {
                    await UserManager.getInstance().updateEmail(email, "test")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(false).to.equal(false)
                }
            })
            it('21. release incorrect', async () => {
                let nickname2 = nickname + "!dsadasd"
                let email2 = email + "!sdads"
                await UserManager.getInstance().release(email2, nickname2)

                expect(await UserManager.getInstance().validateEmail(email2)).to.equal(true)
                expect(await UserManager.getInstance().validateNickname(nickname2)).to.equal(true)

                expect(await UserManager.getInstance().validateEmailRes(email2)).to.equal(true)
                expect(await UserManager.getInstance().validateNicknameRes(nickname2)).to.equal(true)
            })
        })
        describe('3. SessionManager', () => {
            it('1. login', async () => {
                let sessionRegistry = await SessionRegistry.getInstance()

                rf = await sessionRegistry.addSession(user, "test")
                at = await sessionRegistry.accessTokenRequest(rf, "test")
                let result = await sessionRegistry.getSession(at, "test")

                expect(result).to.deep.include({id: user.getID()})
            })
            it('2. another at rq', async () => {
                let sessionRegistry = await SessionRegistry.getInstance()

                let oldAt = at
                at = await sessionRegistry.accessTokenRequest(rf, "test")
                let result = await sessionRegistry.getSession(at, "test")

                expect(result).to.deep.include({id: user.getID()})

                try {
                    result = await sessionRegistry.getSession(oldAt, "test")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(1).to.equal(1)
                }

            })
            it('3. at rq wrong rf', async () => {
                let sessionRegistry = await SessionRegistry.getInstance()

                try {
                    at = await sessionRegistry.accessTokenRequest(rf + " ", "test")
                    await sessionRegistry.getSession(at, "test")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(0).to.equal(0)
                }
            })
            it('4. wrong at', async () => {
                let sessionRegistry = await SessionRegistry.getInstance()

                try {
                    await sessionRegistry.getSession(at + " ", "test")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(0).to.equal(0)
                }
            })
            it('5. at rq wrong agent', async () => {
                let sessionRegistry = await SessionRegistry.getInstance()

                try {
                    at = await sessionRegistry.accessTokenRequest(rf, "test ")
                    await sessionRegistry.getSession(at, "test ")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(0).to.equal(0)
                }
            })
            it('6. wrong agent', async () => {
                let sessionRegistry = await SessionRegistry.getInstance()

                try {
                    await sessionRegistry.getSession(at, "test ")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(0).to.equal(0)
                }
            })
            it('7. removeSession wrong rf', async () => {
                let sessionRegistry = await SessionRegistry.getInstance()

                rf = await sessionRegistry.addSession(user, "test")
                at = await sessionRegistry.accessTokenRequest(rf, "test")

                try {
                    await sessionRegistry.removeSession(rf + " ")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(0).to.equal(0)
                }
                let result = await sessionRegistry.getSession(at, "test")
                expect(result).to.deep.include({id: user.getID()})
            })
            it('8. removeSession', async () => {
                let sessionRegistry = await SessionRegistry.getInstance()

                await sessionRegistry.removeSession(rf)

                try {
                    await sessionRegistry.getSession(at, "test")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(0).to.equal(0)
                }

                try {
                    await sessionRegistry.accessTokenRequest(rf, "test")
                    expect(1).to.equal(0)
                } catch (e) {
                    expect(0).to.equal(0)
                }
            })
        })
        describe('4. Email', () => {
            it('1. forgot password', async () => {
                let initialToken = SessionRegistry.generateToken(8);

                expect(async () => {
                    await MailManager.getInstance().unverifiedRequest(
                        ActionType.FORGOT_PASSWORD,
                        async () => {
                            return user
                        },
                        user.getFName(),
                        user.getLName(),
                        user.getEmail(),
                        user.getNickname(),
                        initialToken)
                }).not.to.throw();
            })
            it('2. delete account', async () => {
                let rf = await (await SessionRegistry.getInstance()).addSession(user, "test")

                expect(async () => {
                    await MailManager.getInstance().verificationRequest(ActionType.DELETE_ACCOUNT, async () => {
                        await UserManager.getInstance().deleteUser(user);
                        await (await SessionRegistry.getInstance()).removeSession(rf);
                        return user
                    }, user)
                }).not.to.throw()
            })
            it('3. register account', async () => {
                let initialToken = SessionRegistry.generateToken(8);

                expect(async () => {
                    await MailManager.getInstance().unverifiedRequest(ActionType.REGISTER, async () => {
                        return await UserManager.getInstance().addUser(nickname, email, "testFname", "testLname", "testPassword123");
                    }, "testFname", "testLname", email, nickname, initialToken)
                }).not.to.throw()
            })
            it('4. suspendUser', async () => {
                let initialToken = SessionRegistry.generateToken(8);

                expect(async () => {
                    // this just sends the email does not suspend in reality (that is a separate method)
                    await MailManager.getInstance().suspendUser(user, "2024.10.12", "Because Testing is Important!!!")
                }).not.to.throw()
            })
            it('5. change password', async () => {
                let rf = await (await SessionRegistry.getInstance()).addSession(user, "test")

                expect(async () => {
                    await MailManager.getInstance().verificationRequest(ActionType.CHANGE_PASSWORD, async () => {
                        await UserManager.getInstance().deleteUser(user);
                        await (await SessionRegistry.getInstance()).removeSession(rf);
                        return user
                    }, user)
                }).not.to.throw()
            })
            it('6. change email', async () => {
                let rf = await (await SessionRegistry.getInstance()).addSession(user, "test")

                expect(async () => {
                    await MailManager.getInstance().verificationRequest(ActionType.CHANGE_EMAIL, async () => {
                        await UserManager.getInstance().deleteUser(user);
                        await (await SessionRegistry.getInstance()).removeSession(rf);
                        return user
                    }, user)
                }).not.to.throw()
            })
        })
        describe('5. Bookmark', () => {
            it('1. pushBookmark', async () => {
                let bookmarkManager = await BookmarkManager.getInstance()

                expect(
                    async () => {
                        await bookmarkManager.pushBookmark(
                            user,
                            1,
                            {add: new Date(new Date().getTime() + 1000), delete: false}
                        )
                    }
                ).not.to.throw()
            })
        })
        describe('6. Content Manager', () => {
            it('1. Fetch unspecific, then specify', async () => {
                let content1 = await ContentManager.getInstance().getContentByID(10)
                let content2 = await ContentManager.getInstance().getSpecificByID(10)

                expect(content1.checkIfFullyFetched()).to.equal(false)
                expect(content2.checkIfFullyFetched()).to.equal(true)
            })
            it('2. Get Recommendations', async () => {
                let result = await ContentManager.getInstance().getRecommendedMetas()
                expect(result.length).to.equal(20)
            })
            it('3. Fetch hidden', async () => {
                try {
                    let content1 = await ContentManager.getInstance().getContentByID(5)
                    expect(1).to.equal(0)
                } catch {
                    expect(1).to.equal(1)
                }
            })
            it('4. Fetch hidden specific', async () => {
                try {
                    let content1 = await ContentManager.getInstance().getSpecificByID(5)
                    expect(1).to.equal(0)
                } catch {
                    expect(1).to.equal(1)
                }
            })
            it('5. Fetch course', async () => {
                let content1 = await ContentManager.getInstance().getContentByID(32)

                expect(content1.getID()).to.equal(32)
            })
            it('6. Fetch chapter', async () => {
                let content1 = await ContentManager.getInstance().getContentByID(26)

                expect(content1.getID()).to.equal(26)
            })
            it('7. Fetch course specific', async () => {
                let content1 = await ContentManager.getInstance().getSpecificByID(32)

                expect(content1.getID()).to.equal(32)
                expect(content1.checkIfFullyFetched()).to.equal(true)
            })
            it('8. Fetch chapter specific', async () => {
                let content1 = await ContentManager.getInstance().getSpecificByID(26)

                expect(content1.getID()).to.equal(26)
                expect(content1.checkIfFullyFetched()).to.equal(true)
            })
            it('9. Fetch many', async () => {
                let content1 = await ContentManager.getInstance().fetchContentsWithIDs([11, 17, 27, 17, 18, 113, 33])

                expect(content1.length).to.equal(7)
            })
        })
        describe('7. Content Manager Modifications', () => {
            describe('1. Creation Amendment', () => {
                it('1. Create Course 1', async () => {
                    let manager = await KeywordManager.getInstance()
                    let result = (await ContentManager.getInstance().createCreationAmendment(
                        user.getID(),
                        "args.name",
                        "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                        await manager.createKeywords([{
                            word: "test1",
                            Score: 100
                        }, {
                            word: "test2",
                            Score: 100
                        }, {
                            word: "test3",
                            Score: 100
                        }, {
                            word: "test4",
                            Score: 100
                        }]), 0, ContentType.COURSE))

                    created.push(result)

                    expect(await ContentManager.getInstance().getSpecificByID(result.getTargetID())).to.deep.include({name: "args.name"})
                })
                it('2. Create Chapter 1', async () => {
                    let manager = await KeywordManager.getInstance()
                    let result = (await ContentManager.getInstance().createCreationAmendment(
                        user.getID(),
                        "args.name1",
                        "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                        await manager.createKeywords([{
                            word: "test1",
                            Score: 100
                        }, {
                            word: "test2",
                            Score: 100
                        }, {
                            word: "test3",
                            Score: 100
                        }, {
                            word: "test4",
                            Score: 100
                        }]), 0, ContentType.CHAPTER, created[0].getTargetID()))

                    created.push(result)
                    await result.applyThisAmendment()
                    expect(await ContentManager.getInstance().getSpecificByID(result.getTargetID())).to.deep.include({name: "args.name1"})
                })
                it('3. Create Lesson 1', async () => {
                    let manager = await KeywordManager.getInstance()
                    let result = (await ContentManager.getInstance().createCreationAmendment(
                        user.getID(),
                        "args.name2",
                        "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                        await manager.createKeywords([{
                            word: "test1",
                            Score: 100
                        }, {
                            word: "test2",
                            Score: 100
                        }, {
                            word: "test3",
                            Score: 100
                        }, {
                            word: "test4",
                            Score: 100
                        }]), 0, ContentType.LESSON, created[1].getTargetID()))

                    created.push(result)
                    await result.applyThisAmendment()

                    expect(await ContentManager.getInstance().getSpecificByID(result.getTargetID())).to.deep.include({name: "args.name2"})
                })
                it('4. Create Course 2', async () => {
                    let manager = await KeywordManager.getInstance()
                    let result = (await ContentManager.getInstance().createCreationAmendment(
                        user.getID(),
                        "args.name3",
                        "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                        await manager.createKeywords([{
                            word: "test1",
                            Score: 100
                        }, {
                            word: "test2",
                            Score: 100
                        }, {
                            word: "test3",
                            Score: 100
                        }, {
                            word: "test4",
                            Score: 100
                        }]), 0, ContentType.COURSE))

                    created.push(result)

                    await result.applyThisAmendment()
                    expect(await ContentManager.getInstance().getSpecificByID(result.getTargetID())).to.deep.include({name: "args.name3"})
                })
                it('5. Create Chapter 2', async () => {
                    let manager = await KeywordManager.getInstance()
                    let result = (await ContentManager.getInstance().createCreationAmendment(
                        user.getID(),
                        "args.name4",
                        "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                        await manager.createKeywords([{
                            word: "test1",
                            Score: 100
                        }, {
                            word: "test2",
                            Score: 100
                        }, {
                            word: "test3",
                            Score: 100
                        }, {
                            word: "test4",
                            Score: 100
                        }]), 32, ContentType.CHAPTER, created[0].getTargetID()))

                    created.push(result)

                    await result.applyThisAmendment()
                    expect(await ContentManager.getInstance().getSpecificByID(result.getTargetID())).to.deep.include({name: "args.name4"})
                })
                it('6. Create Course with redundant Parent', async () => {
                    let manager = await KeywordManager.getInstance()
                    try {
                        let result = (await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name4",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 0, ContentType.COURSE, created[0].getTargetID()))
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('7. Create Chapter without Parent', async () => {
                    let manager = await KeywordManager.getInstance()
                    try {
                        let result = (await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name4",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 0, ContentType.CHAPTER))
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('8. Create Chapter with Lesson Parent', async () => {
                    let manager = await KeywordManager.getInstance()
                    try {
                        let result = (await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name4",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 0, ContentType.CHAPTER, created[2].getTargetID()))
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('9. Create Chapter with Chapter Parent', async () => {
                    let manager = await KeywordManager.getInstance()
                    try {
                        let result = (await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name4",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 0, ContentType.CHAPTER, created[1].getTargetID()))
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('10. Create Lesson with Lesson Parent', async () => {
                    let manager = await KeywordManager.getInstance()
                    try {
                        let result = (await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name4",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 0, ContentType.LESSON, created[2].getTargetID()))
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('11. Create Lesson with Course Parent', async () => {
                    let manager = await KeywordManager.getInstance()
                    try {
                        let result = (await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name4",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 0, ContentType.LESSON, created[0].getTargetID()))
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('12. Create Lesson without Parent', async () => {
                    let manager = await KeywordManager.getInstance()
                    try {
                        let result = (await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name4",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 0, ContentType.LESSON))
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('13. Create Content on taken seqNum', async () => {
                    let manager = await KeywordManager.getInstance()
                    try {
                        let result = (await ContentManager.getInstance().createCreationAmendment(
                            user.getID(),
                            "args.name4",
                            "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                            await manager.createKeywords([{
                                word: "test1",
                                Score: 100
                            }, {
                                word: "test2",
                                Score: 100
                            }, {
                                word: "test3",
                                Score: 100
                            }, {
                                word: "test4",
                                Score: 100
                            }]), 32, ContentType.CHAPTER, created[0].getTargetID()))

                        created.push(result)

                        await result.applyThisAmendment()
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
                it('14. Create SEQ overlap case', async () => {
                    let manager = await KeywordManager.getInstance()
                    let result1 = (await ContentManager.getInstance().createCreationAmendment(
                        user.getID(),
                        "args.name3",
                        "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                        await manager.createKeywords([{
                            word: "test1",
                            Score: 100
                        }, {
                            word: "test2",
                            Score: 100
                        }, {
                            word: "test3",
                            Score: 100
                        }, {
                            word: "test4",
                            Score: 100
                        }]), 64, ContentType.CHAPTER, created[0].getTargetID()))

                    let result = (await ContentManager.getInstance().createCreationAmendment(
                        user.getID(),
                        "args.name4",
                        "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                        await manager.createKeywords([{
                            word: "test1",
                            Score: 100
                        }, {
                            word: "test2",
                            Score: 100
                        }, {
                            word: "test3",
                            Score: 100
                        }, {
                            word: "test4",
                            Score: 100
                        }]), 64, ContentType.CHAPTER, created[0].getTargetID()))

                    created.push(result1)
                    created.push(result)

                    await result1.applyThisAmendment()
                    await result.applyThisAmendment()

                    let meta1 = await (await ContentManager.getInstance().getSpecificByID(result.getTargetID())).getMeta()

                    expect(meta1).to.deep.include({name: "args.name4"})
                })
            })
            describe('2. Meta Amendment', () => {
                it('1. normal', async () => {
                    let manager = await KeywordManager.getInstance()

                    let oldNoAmend = await (await ContentManager.getInstance().getContentByID(created[0].getTargetID())).getAmendmentsOutput()

                    let args = {
                        changes: {
                            addedKeywords: [
                                {
                                    word: "adsads",
                                    Score: 100
                                }
                            ],
                            deletedKeywordIDs: [
                                (await (await ContentManager.getInstance().getContentByID(created[0].getTargetID())).getMeta()).keywords[0].ID
                            ],
                            newName: "newName22",
                            newDescription: "newDescriptionsanadas djasdk asldhas dkash jahs jkdhj ashdl asd"
                        }
                    }

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

                    let amendment = await ContentManager.getInstance().createMetaAmendment(user.getID(), created[0].getTargetID(), providingArgs)
                    await amendment.applyThisAmendment();

                    let result = await ContentManager.getInstance().getContentByID(created[0].getTargetID())

                    created.push(amendment)

                    expect(await result.getMeta()).to.deep.include({name: "newName22"})
                })
                it('2. no change', async () => {
                    let manager = await KeywordManager.getInstance()

                    let oldNoAmend = await (await ContentManager.getInstance().getContentByID(created[0].getTargetID())).getAmendmentsOutput()

                    try {
                        let args = {
                            changes: {
                                addedKeywords: [
                                    {
                                        word: "adsads",
                                        Score: 100
                                    }
                                ],
                                deletedKeywordIDs: [
                                    (await (await ContentManager.getInstance().getContentByID(created[0].getTargetID())).getMeta()).keywords[0].ID
                                ],
                                newName: "newName22",
                                newDescription: "newDescriptionsanadas djasdk asldhas dkash jahs jkdhj ashdl asd"
                            }
                        }

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

                        let providingArgs = {}

                        let amendment = await ContentManager.getInstance().createMetaAmendment(user.getID(), created[0].getTargetID(), providingArgs)
                        await amendment.applyThisAmendment();

                        let result = await ContentManager.getInstance().getContentByID(created[0].getTargetID())

                        expect(await result.getMeta()).to.deep.include({name: "newName22"})
                        expect((await result.getAmendmentsOutput()).length).to.equal(oldNoAmend.length + 1)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
                it('3. del keywords wrong', async () => {
                    let manager = await KeywordManager.getInstance()

                    let oldNoAmend = await (await ContentManager.getInstance().getContentByID(created[0].getTargetID())).getAmendmentsOutput()

                    try {
                        let args = {
                            changes: {
                                addedKeywords: [
                                    {
                                        word: "adsads",
                                        Score: 100
                                    }
                                ],
                                deletedKeywordIDs: [
                                    5
                                ],
                                newName: "newName22",
                                newDescription: "newDescriptionsanadas djasdk asldhas dkash jahs jkdhj ashdl asd"
                            }
                        }

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

                        let amendment = await ContentManager.getInstance().createMetaAmendment(user.getID(), created[0].getTargetID(), providingArgs)
                        await amendment.applyThisAmendment();

                        let result = await ContentManager.getInstance().getContentByID(created[0].getTargetID())

                        expect(await result.getMeta()).to.deep.include({name: "newName22"})
                        expect((await result.getAmendmentsOutput()).length).to.equal(oldNoAmend.length + 1)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
                it('4. no Keyword changes', async () => {
                    let manager = await KeywordManager.getInstance()

                    let oldNoAmend = await (await ContentManager.getInstance().getContentByID(created[0].getTargetID())).getAmendmentsOutput()

                    let args = {
                        changes: {
                            newName: "newName23",
                            newDescription: "newDescriptionsanadas djasdk  sdas saasldhas dkash jahs jkdhj ashdl asd"
                        }
                    }

                    let providingArgs = {
                        newName: args.changes.newName,
                        newDescription: args.changes.newDescription,
                    }

                    let amendment = await ContentManager.getInstance().createMetaAmendment(user.getID(), created[0].getTargetID(), providingArgs)
                    await amendment.applyThisAmendment();

                    let result = await ContentManager.getInstance().getContentByID(created[0].getTargetID())

                    expect(await result.getMeta()).to.deep.include({name: "newName23"})
                })
            })
            describe('3. Adoption Amendment', () => {
                it('1. chapter moves to course', async () => {
                    let amend = await ContentManager.getInstance().createAdoptionAmendment(user.getID(), created[4].getTargetID(), created[3].getTargetID())
                    await amend.applyThisAmendment()
                    expect(amend.getValueOfApplied()).to.equal(true)

                    created.push(amend)
                })
                it('2. lesson moves to chapter', async () => {
                    let amend = await ContentManager.getInstance().createAdoptionAmendment(user.getID(), created[4].getTargetID(), created[3].getTargetID())
                    await amend.applyThisAmendment()
                    expect(amend.getValueOfApplied()).to.equal(true)

                    created.push(amend)
                })
                it('3. course moves', async () => {
                    try {
                        await ContentManager.getInstance().createAdoptionAmendment(user.getID(), created[0].getTargetID(), created[4].getTargetID())
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
                it('4. chapter moves to chapter', async () => {
                    try {
                        await ContentManager.getInstance().createAdoptionAmendment(user.getID(), created[4].getTargetID(), created[2].getTargetID())
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
                it('5. chapter moves to lesson', async () => {
                    try {
                        await ContentManager.getInstance().createAdoptionAmendment(user.getID(), created[2].getTargetID(), created[4].getTargetID())
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
                it('6. lesson moves to course', async () => {
                    try {
                        await ContentManager.getInstance().createAdoptionAmendment(user.getID(), created[2].getTargetID(), created[3].getTargetID())
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
                it('7. lesson moves to lesson', async () => {
                    try {
                        await ContentManager.getInstance().createAdoptionAmendment(user.getID(), created[2].getTargetID(), created[2].getTargetID())
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
            })
            describe('4. EditList Amendment', () => {
                it('1. normal changes', async () => {
                    let changes = [
                        {
                            ChildID: created[1].getTargetID(),
                            newSeqNumber: 160,
                            delete: false
                        }
                    ]

                    let amend = await ContentManager.getInstance().createListAmendment(user.getID(), created[0].getTargetID(), changes)
                    await amend.applyThisAmendment();

                    created.push(amend)

                    expect(
                        (await ContentManager.getInstance().getSpecificByID(created[1].getTargetID())).getSeqNumber()
                    ).to.equal(128)
                })
                it('2. deletion changes', async () => {

                    let changes = [
                        {
                            ChildID: created[1].getTargetID(),
                            delete: true
                        }
                    ]

                    let amend = await ContentManager.getInstance().createListAmendment(user.getID(), created[0].getTargetID(), changes)
                    await amend.applyThisAmendment();

                    expect(amend.getValueOfApplied()).to.equal(true)
                })
                it('3. wrong changes', async () => {

                    let changes = [
                        {
                            ChildID: created[0].getTargetID(),
                            delete: true
                        }
                    ]

                    try {
                        let amend = await ContentManager.getInstance().createListAmendment(user.getID(), created[0].getTargetID(), changes)
                        await amend.applyThisAmendment();
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
            })
            describe('5. PartAddReplace Amendment', () => {
                it('1. createParagraph', async () => {
                    let amend = await ContentManager.getInstance().createAddReplaceAmendment(user.getID(), created[2].getTargetID(), 32, {
                        newArgs: {
                            type: lessonPartTypes.PARAGRAPH, content: {
                                basicText: "test_test_test_testtest_testtest_testtest_testtest_testtest_testtest_testtest_testtest_testtest_test",
                                advancedText: "test_test_test_testtest"
                            }
                        }
                    })
                    await amend.applyThisAmendment();

                    created.push(amend)
                })
                it('2. createEmbeddable', async () => {
                    let amend = await ContentManager.getInstance().createAddReplaceAmendment(user.getID(), created[2].getTargetID(), 32, {
                        newArgs: {
                            type: lessonPartTypes.EMBEDDABLE, content: {
                                uri: "test.png",
                                localCacheImage: false
                            }
                        }
                    })
                    await amend.applyThisAmendment();
                    created.push(amend)
                })
                it('3. createQuizQuestion', async () => {
                    let amend = await ContentManager.getInstance().createAddReplaceAmendment(user.getID(), created[2].getTargetID(), 32, {
                        newArgs: {
                            type: lessonPartTypes.QUIZ_QUESTION, content: {
                                question: "string",
                                type: "WrittenQuestion",
                                answer: [{content: "string", correct: true, feedback: undefined}]
                            }
                        }
                    })
                    await amend.applyThisAmendment();
                    created.push(amend)
                })
                it('4. createQuizQuestion wrong type', async () => {
                    try {
                        await ContentManager.getInstance().createAddReplaceAmendment(user.getID(), created[2].getTargetID(), 32, {
                            newArgs: {
                                type: lessonPartTypes.QUIZ_QUESTION, content: {
                                    question: "string",
                                    type: "string",
                                    answer: [{content: "string", correct: true, feedback: undefined}]
                                }
                            }
                        })
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }

                })
                it('5. createParagraph wrong parent', async () => {
                    try {
                        await ContentManager.getInstance().createAddReplaceAmendment(user.getID(), created[0].getTargetID(), 32, {
                            newArgs: {
                                type: lessonPartTypes.PARAGRAPH, content: {
                                    basicText: "test_test_test_testtest_testtest_testtest_testtest_testtest_testtest_testtest_testtest_testtest_test",
                                    advancedText: "test_test_test_testtest"
                                }
                            }
                        })
                        expect(1).to.equal(0)
                    } catch (e) {
                        expect(0).to.equal(0)
                    }
                })
            })
        })
        describe('8. Content Tests', () => {
            it('1. Constructor using an Amendment', async () => {
                let manager = await KeywordManager.getInstance();

                let result = (await ContentManager.getInstance().createCreationAmendment(
                    user.getID(),
                    "args.name",
                    "args.description asdasdasdas das dsd asd sd ds d dasd as asasdas",
                    await manager.createKeywords([{
                        word: "test1",
                        Score: 100
                    }, {
                        word: "test2",
                        Score: 100
                    }, {
                        word: "test3",
                        Score: 100
                    }, {
                        word: "test4",
                        Score: 100
                    }]), 0, ContentType.COURSE))

                resultContent = new Course(1000, 1000, result)

                expect(resultContent.getName()).to.equal("args.name")
            })
            it('2. Vote', async () => {
                let content1 = await ContentManager.getInstance().getSpecificByID(created[0].getTargetID())

                await content1.vote(user, true)

                expect(user.checkOpinion(created[0].getTargetID())).to.equal(1)

                await content1.vote(user, true)

                expect(user.checkOpinion(created[0].getTargetID())).to.equal(-1)

                await content1.vote(user, false)

                expect(user.checkOpinion(created[0].getTargetID())).to.equal(0)

                await content1.vote(user, false)

                expect(user.checkOpinion(created[0].getTargetID())).to.equal(-1)

                await content1.vote(user, true)
                await content1.vote(user, false)

                expect(user.checkOpinion(created[0].getTargetID())).to.equal(0)

                await content1.vote(user, true)

                expect(user.checkOpinion(created[0].getTargetID())).to.equal(1)
            })
            it('3. Get Type', async () => {
                expect((resultContent as Content).getType()).to.equal(ContentType.COURSE)
            })
            it('4. ContentNotFetched errors', async () => {
                /* these work but their coverage is not counting */
                it('1. sub test', async () => {
                    let unspecific = await ContentManager.getInstance().getContentByID(50)
                    expect(async () => {
                        await unspecific.fullRead()
                    }).to.throw()
                })
                it('2. sub test', async () => {
                    try {
                        let amend = await ContentManager.getInstance().createAdoptionAmendment(user.getID(), created[4].getTargetID(), created[0].getTargetID())
                        await (resultContent as Content).getAdopted(amend)
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('3. sub test', async () => {
                    try {
                        let changes = [
                            {
                                ChildID: created[2].getTargetID(),
                                newSeqNumber: 160,
                                delete: false
                            }
                        ]

                        let amend = await ContentManager.getInstance().createListAmendment(user.getID(), created[1].getTargetID(), changes)
                        await (resultContent as Content).applyListAmendment(amend)
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('4. sub test', async () => {
                    try {
                        (resultContent as Content).checkSeqNumberVacant(32)
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('5. sub test', async () => {
                    try {
                        let amend = await ContentManager.getInstance().createAddReplaceAmendment(user.getID(), created[2].getTargetID(), 32, {
                            newArgs: {
                                type: lessonPartTypes.EMBEDDABLE, content: {
                                    uri: "test.png",
                                    localCacheImage: false
                                }
                            }
                        });
                        await (resultContent as Content).applyPartAddReplaceAmendment(amend)
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('6. sub test', async () => {
                    try {
                        let changes = [
                            {
                                ChildID: created[2].getTargetID(),
                                newSeqNumber: 160,
                                delete: false
                            }
                        ];

                        await (resultContent as Content).checkPaternity(changes)
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('7. sub test', async () => {
                    try {
                        (resultContent as Content).getContentShareOfUser(1)
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('8. sub test', async () => {
                    try {
                        (resultContent as Content).getContentShareOfUserOneLevel(32)
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
            })
            it('5. View', async () => {
                let bef = resultContent.getSignificance()
                await resultContent.view()

                assert(bef < resultContent.getSignificance())
            })
        })
        describe('9. Course Tests', () => {
            it('1. Deep Course', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(11)
                expect((await content.fullRead()).metas.meta.id).to.equal(11)
            })

            it('2. Check Paternity', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(11)
                expect(await content.checkPaternity([{LessonPartID: 0, delete: true}])).to.equal(false)
            })

            it('3. Get Content Share One Level', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(11)
                assert(content.getContentShareOfUserOneLevel(1)[0] > 0)
            })

            it('4. Add child on taken', async () => {
                let content = (await ContentManager.getInstance().getSpecificByID(11) as Course)
                let chapter = (await ContentManager.getInstance().getSpecificByID(4) as Chapter)
                expect(() => {
                    content.addChild(32, chapter)
                }).to.throw()
            })

            it('5. Deep Course Multiple creators', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(1)
                expect((await content.fullRead()).metas.meta.id).to.equal(1)
            })


        })
        describe('10. Chapter Tests', () => {
            it('1. Full read', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(2)
                expect((await content.fullRead()).metas.meta.id).to.equal(1)
            })
            it('2. View', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(2)

                let bef = content.getSignificance();

                await content.view()
                assert(bef < content.getSignificance())
            })

            it('3. Apply List Amendment', async () => {
                let changes = [
                    {
                        ChildID: created[2].getTargetID(),
                        newSeqNumber: 160,
                        delete: false
                    }
                ]

                let amend = await ContentManager.getInstance().createListAmendment(user.getID(), created[1].getTargetID(), changes)
                await amend.applyThisAmendment();

                expect((await ContentManager.getInstance().getSpecificByID(created[2].getTargetID())).getSeqNumber()).to.equal(32)
            })
        })
        describe('11. Lesson Tests', () => {
            it('1. Full read', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(17)
                expect((await content.fullRead()).metas.meta.id).to.equal(11)
            })
            it('2. View', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(17)

                let bef = content.getSignificance();

                await content.view()
                assert(bef < content.getSignificance())
            })
            it('3. Add child', async () => {
                let amend = await ContentManager.getInstance().createAddReplaceAmendment(user.getID(), created[2].getTargetID(), 0, {
                    newArgs: {
                        type: lessonPartTypes.PARAGRAPH, content: {
                            basicText: "test_test_test_testtest_testtest_testtest_testtest_testtest_testtest_testtest_testtest_testtest_test",
                            advancedText: "test_test_test_testtest"
                        }
                    }
                })
                await amend.applyThisAmendment();

                let content = await ContentManager.getInstance().getSpecificByID(created[2].getTargetID())

                let read = await content.fullRead()

                expect(read.content![0].output.__typename).to.equal("ParagraphOutput")
            })
            it('4. Apply List Amendment', async () => {

                let content = await ContentManager.getInstance().getSpecificByID(created[2].getTargetID())

                let read = await content.fullRead()

                let bef = read.content?.length!

                let changes = [
                    {
                        LessonPartID: read.content![0].id,
                        newSeqNumber: 37,
                        delete: false
                    },
                    {
                        LessonPartID: read.content![1].id,
                        delete: true
                    }
                ]

                let amend = await ContentManager.getInstance().createListAmendment(user.getID(), created[2].getTargetID(), changes)
                await amend.applyThisAmendment();


                content = await ContentManager.getInstance().getSpecificByID(created[2].getTargetID())

                read = await content.fullRead()

                assert(read.content!.length < bef)
            })
            it('5. PartAdd Amendment Replacing', async () => {

                let content = await ContentManager.getInstance().getSpecificByID(created[2].getTargetID())

                let read = await content.fullRead()

                let bef = read.content?.length!

                let amend = await ContentManager.getInstance().createAddReplaceAmendment(user.getID(), created[2].getTargetID(), 32, {
                    newArgs: {
                        type: lessonPartTypes.PARAGRAPH, content: {
                            basicText: "test_test_test_testtest_testtest_testtest_testtest_testtest_testtest_testtest_testtest_testtest_test",
                            advancedText: "test_test_test_testtest"
                        }
                    },
                    oldID: read.content![0].id
                })
                await amend.applyThisAmendment();


                content = await ContentManager.getInstance().getSpecificByID(created[2].getTargetID())

                read = await content.fullRead()

                assert(read.content!.length === bef)
            })
            it('6. Check seq number vacant', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(17)
                expect(content.checkSeqNumberVacant(32)).to.equal(false)
                expect(content.checkSeqNumberVacant(33)).to.equal(true)
            })
            it('7. Get LessonByID', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(created[2].getTargetID())

                let read = await content.fullRead()

                let correctID = read.content![0].id;
                let wrongID = -100;

                expect((content as Lesson).getLessonPartByID(correctID).getID()).to.equal(correctID)
                expect(() => {
                    (content as Lesson).getLessonPartByID(wrongID).getID()
                }).to.throw()
            })
            it('8. Check Paternity', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(created[2].getTargetID())

                let read = await content.fullRead()

                let correctID = read.content![0].id;
                let wrongID = -100;

                let changes = [
                    {
                        LessonPartID: correctID,
                        delete: true
                    }
                ]

                expect(await content.checkPaternity(changes)).to.equal(true)

                changes = [
                    {
                        LessonPartID: wrongID,
                        delete: true
                    }
                ]

                expect(await content.checkPaternity(changes)).to.equal(false)

                let changes2 = [
                    {
                        ChildID: correctID,
                        delete: true
                    }
                ]

                expect(await content.checkPaternity(changes2)).to.equal(false)
            })
            it('9. Adoption Test', async () => {
                let amend = await ContentManager.getInstance().createAdoptionAmendment(user.getID(), created[2].getTargetID(), created[4].getTargetID())
                await amend.applyThisAmendment()
                expect(amend.getValueOfApplied()).to.equal(true)
            })
            it('10. Full read many authors', async () => {
                let content = await ContentManager.getInstance().getSpecificByID(10)
                expect((await content.fullRead()).metas.meta.id).to.equal(6)
            })
        })
        describe('12. Tools', () => {
            it('1. Expirable with no expiry', async () => {
                let expirable = new Expirable();

                expect(expirable.getTTL()).to.equal(-1)
                expect(expirable.checkValidity()).to.equal(true)
            })
            it('2. Testing Errors', async () => {
                expect(() => {
                    throw new ActionNotDefined()
                }).to.throw()
                expect(() => {
                    throw new CodeMismatch()
                }).to.throw()
                expect(() => {
                    throw new EmptyModification()
                }).to.throw()
                expect(() => {
                    throw new ContentNotFetched()
                }).to.throw()
                expect(() => {
                    throw new ContentNotNavigable()
                }).to.throw()
                expect(() => {
                    throw new ContentNeedsParent()
                }).to.throw()
                expect(() => {
                    throw new MissingLessonPart()
                }).to.throw()
                expect(() => {
                    throw new NoChanges()
                }).to.throw()
                expect(() => {
                    throw new LegacyAmendment()
                }).to.throw()
                expect(() => {
                    throw new UserRobot()
                }).to.throw()
                expect(() => {
                    throw new UnsupportedOperation("test", "test")
                }).to.throw()
            })
            it('3. SelfPuringMap', async () => {
                let map = new SelfPurgingMap(0.001)
                let mapINF = new SelfPurgingMap()

                map.set("1", new Expirable(0.001))
                map.set("2", new Expirable(1000))

                mapINF.set("1", new Expirable(0.001))
                mapINF.set("2", new Expirable(1000))

                // introduce synchronous delay
                await new Promise(r => setTimeout(r, 100));

                map.set("3", new Expirable(1000))
                mapINF.set("3", new Expirable(1000))

                // introduce synchronous delay
                await new Promise(r => setTimeout(r, 100));

                assert(map.size == 2)
                assert(mapINF.size === 3)
            })
            it('4. Purgeable', async () => {
                expect(async () => {
                    class funnyTest extends Purgeable {
                        public notifyPUB() {
                            super.notify()
                        }
                    }

                    let purgeable = new funnyTest(0.001);
                    let purgeableINF = new funnyTest();

                    await new Promise(r => setTimeout(r, 100));

                    purgeable.notifyPUB();
                    purgeableINF.notifyPUB();
                }).to.not.throw()
            })
        })
        describe('13. LessonParts', () => {
            describe('1. Embeddable', () => {
                expect(Embeddable.getType("https://www.youtube.com/watch?v=31212231")).to.equal("Youtube")
                expect(Embeddable.getType("https://youtu.be/31212231")).to.equal("Youtube")
                expect(Embeddable.getType("https://gist.github.com/31231231231/31231232131")).to.equal("GithubGist")
                expect(() => {
                    Embeddable.getType("https://www.youtube.com/watch?v=31212231=123123")
                }).to.throw()
                expect(() => {
                    Embeddable.getType("https://youtu.be/3121/2231")
                }).to.throw()
                expect(() => {
                    Embeddable.getType("https://gist.githu/b.com/")
                }).to.throw()
                expect(() => {
                    Embeddable.getType("asdasdadasdaqda")
                }).to.throw()
            })
            describe('2. Quiz Question', () => {
                it('1. Constructor with no answers', () => {
                    expect(() => {
                        new QuizQuestion(-1, 32, "dsadsda", "WrittenQuestion", [])
                    }).to.throw()
                })
            })
            describe('3. Lesson Part', () => {
                it('1. Link modifiers Youtube', async () => {
                    let test = "1231231231"
                    let out = await LessonPartManager.getInstance().push(32, {
                        type: lessonPartTypes.EMBEDDABLE,
                        content: {
                            localCacheImage: false,
                            uri: "https://www.youtube.com/watch?v=" + test
                        }
                    })

                    expect(((await LessonPartManager.getInstance().retrieve(out)) as Embeddable).getDisplayable().output)
                        .to.deep.include({uri: "https://www.youtube.com/embed/" + test})

                    out = await LessonPartManager.getInstance().push(32, {
                        type: lessonPartTypes.EMBEDDABLE,
                        content: {
                            localCacheImage: false,
                            uri: "https://youtu.be/" + test
                        }
                    })

                    expect(((await LessonPartManager.getInstance().retrieve(out)) as Embeddable).getDisplayable().output)
                        .to.deep.include({uri: "https://www.youtube.com/embed/" + test})
                })
                it('2. Link modifiers Github', async () => {
                    let test = "1231231231"
                    let out = await LessonPartManager.getInstance().push(32, {
                        type: lessonPartTypes.EMBEDDABLE,
                        content: {
                            localCacheImage: false,
                            uri: "https://gist.github.com/" + test + "/" + test
                        }
                    })

                    expect(((await LessonPartManager.getInstance().retrieve(out)) as Embeddable).getDisplayable().output)
                        .to.deep.include({uri: test})
                })
                it('3. Retrieve not found', async () => {
                    try {
                        await LessonPartManager.getInstance().retrieve(-100)
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('4. Errors on ignoring types', async () => {
                    try {
                        await LessonPartManager.getInstance().push(32, {
                            type: 7,
                            content: {
                                uri: "test",
                                localCacheImage: false
                            }
                        })
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
                it('5. Retrieve with feedback', async () => {
                    expect((await LessonPartManager.getInstance().retrieve(50)).getID()).to.equal(50)
                })
                it('5. Fetch Broken', async () => {
                    try {
                        (await LessonPartManager.getInstance().retrieve(313)).getID()
                        expect(1).to.equal(0)
                    } catch {
                        expect(0).to.equal(0)
                    }
                })
            })
        })
        describe('14. Keywords', () => {
            it('1. Keyword Errors', () => {
                try {
                    new Keyword(-1, 0, "blah")
                    expect(0).to.equal(1)
                } catch {
                    expect(0).to.equal(0)
                }
                try {
                    new Keyword(-1, 101, "blah")
                    expect(0).to.equal(1)
                } catch {
                    expect(0).to.equal(0)
                }
                try {
                    new Keyword(-1, 77.77, "blah")
                    expect(0).to.equal(1)
                } catch {
                    expect(0).to.equal(0)
                }
                try {
                    new Keyword(-1, 77, "blahblahblahblahblahblahblahblahblah")
                    expect(0).to.equal(1)
                } catch {
                    expect(0).to.equal(0)
                }
                try {
                    new Keyword(-1, 77, "bl")
                    expect(0).to.equal(1)
                } catch {
                    expect(0).to.equal(0)
                }
                try {
                    new Keyword(-1, 77, "blah!")
                    expect(0).to.equal(1)
                } catch {
                    expect(0).to.equal(0)
                }
                try {
                    new Keyword(-1, 77, "Blah")
                    expect(0).to.equal(1)
                } catch {
                    expect(0).to.equal(0)
                }
            })
            it('2. Keyword Search', async () => {
                let manager = await KeywordManager.getInstance()

                let result = await manager.resolveSearch("test1 hello notevengonnafindit youtube embeddable")

                assert(result.length > 1)
            })
            it('3. Keyword Search ID not found', async () => {
                let manager = await KeywordManager.getInstance()

                try {
                    let result = await manager.getKeywordByID(-1)
                    expect(1).to.equal(0)
                } catch {
                    expect(0).to.equal(0)
                }
            })
            it('4. Activating completely new Keyword', async () => {
                let manager = await KeywordManager.getInstance()

                let keyword = new Keyword(1000000, 50, "thisiscompleteutter")

                manager.activate(keyword, 17)
            })
            it('5. Removing active which is not present', async () => {
                let manager = await KeywordManager.getInstance()

                let keyword = new ActiveKeyword(1000000, 50, "thereisnochance", 17)

                manager.deactivate(keyword)
            })
        })
        describe('15. Amendments', () => {
            it('1. Specific Output', async () => {
                for (let amend of created) {
                    expect((await amend.getFullAmendmentOutput()).id).to.equal(amend.getID())
                }
            })
            it('2. Get cost', async () => {
                assert(created[0].getCost() > 0)
            })
            it('3. Veto', async () => {
                await created[created.length - 1].veto()
                assert(created[created.length - 1].getVeto() === true)
            })
            it('4. CheckFulfillment Output', async () => {
                for (let amend of created) {
                    expect((await amend.checkFulfillmentAndReturn()).amendmentID).to.equal(amend.getID())
                }
            })
            it('5. Get ID of -1', async () => {
                let amend = new Amendment(-1, null, 17, 1000, 1000)

                expect(() => {
                    amend.getID()
                }).to.throw()
            })
            it('6. Amendment not fetched error', async () => {
                let amend = new Amendment(1100, null, 17, 1000, 1000)

                try {
                    amend.fullyFetched()
                    expect(1).to.equal(0)
                } catch {
                    expect(0).to.equal(0)
                }
                try {
                    await amend.applyThisAmendment()
                    expect(1).to.equal(0)
                } catch {
                    expect(0).to.equal(0)
                }
                try {
                    amend.fullyFetched()
                    expect(1).to.equal(0)
                } catch {
                    expect(0).to.equal(0)
                }
                try {
                    amend.getType()
                    expect(1).to.equal(0)
                } catch {
                    expect(0).to.equal(0)
                }
            })
            it('7. Many functions with top 250 amendments', async () => {
                for (let i = 1; i <= 250; i++) {
                    let output = await AmendmentManager.getInstance().retrieveSpecific(i)
                    expect((await output.getFullAmendmentOutput()).id).to.equal(i)
                    expect((await output.checkFulfillmentAndReturn()).amendmentID).to.equal(i)
                    await output.getType()
                    assert(output.fullyFetched()===true || output.fullyFetched()===false)
                    await output.getSupports(1)
                }
            }).timeout(100000)
        })
    }
);