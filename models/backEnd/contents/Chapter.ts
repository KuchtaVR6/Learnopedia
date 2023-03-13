import Content, {contentShareOutput, ContentType, FullOutput, MetaOutput} from "./Content";
import Lesson from "./Lesson";
import {Course} from "./Course";
import CreationAmendment from "../amendments/CreationAmendment";
import {ActiveKeyword} from "./keywords/Keyword";
import Amendment from "../amendments/Amendment";
import {NotFoundException, SequenceNumberTaken} from "../tools/Errors";
import AdoptionAmendment from "../amendments/AdoptionAmendment";
import prisma from "../../../prisma/prisma";
import ListAmendment from "../amendments/ListAmendment";
import ContentManager from "./ContentManager";

export type ChapterOutput = {
    meta: MetaOutput,
    lessons: MetaOutput[]
}

class Chapter extends Content {
    private parent: Course;
    private children: Map<number, Lesson>;
    private balanced: boolean;

    public constructor(
        id: number,
        specificID: number,
        data:
            CreationAmendment
            |
            {
                name: string,
                description: string,
                keywords: ActiveKeyword[],
                views: number,
                upVotes: number,
                downVotes: number,
                dateModified: Date,
                dateCreated: Date,
                amendments: Array<Amendment>,
                seqNumber: number,
                type: ContentType,
                numberAuthors: number
            },
        parent: Course
    ) {
        super(id, specificID, data);

        this.balanced = true;
        this.parent = parent;

        this.children = new Map<number, Lesson>;
        this.sortChildern();
    }

    private sortChildern() {
        this.children = new Map(Array.from(this.children.entries()).sort((a, b) => {
            if (a[0] < b[0]) {
                return -1
            } else /* excluded see Testing comment No. 5 */ /* istanbul ignore if */ if (a[0] == b[0]) {
                return 0
            } else {
                return 1
            }
        }));
    }

    public async fullRead(): Promise<FullOutput> {
        return this.parent.fullRead();
    }

    public view() {
        super.view()

        this.parent.view()
    }

    protected async getNumberOfAuthors(): Promise<number> {
        if (!this.authorsCache) {
            await this.getAuthors()
        }

        let newNum = this.authorsCache!.size

        if (newNum != this.numberAuthorsFromDB) {
            this.numberAuthorsFromDB = newNum
            await prisma.content.update({
                where: {
                    ID: this.getID()
                },
                data: {
                    numberOfAuthors: this.numberAuthorsFromDB
                }
            })
        }

        return this.numberAuthorsFromDB
    }

    public async getAuthors(): Promise<Map<number, number>> {
        this.authorsCache = await super.getAuthors()

        for (let childKey of Array.from(this.children.keys())) {
            let child = this.children.get(childKey)!
            let fromChild = await child.getAuthors()

            fromChild.forEach((elem, key) => {
                if (this.authorsCache) {
                    let initNum = this.authorsCache.get(key)
                    if (initNum) {
                        this.authorsCache.set(key, elem + initNum)
                    } else {
                        this.authorsCache.set(key, elem)
                    }
                }
            })
        }

        return this.authorsCache
    }

    public async getChapterOutput(): Promise<ChapterOutput> {
        let childrenResults: MetaOutput[] = [];

        for (let child of Array.from(this.children.values())) {
            childrenResults.push(await child.getMeta())
        }

        return {
            meta: await this.getMeta(),
            lessons: childrenResults
        }
    }

    public getType() {
        return ContentType.CHAPTER;
    }

    public async getAdopted(amendment: AdoptionAmendment) {
        await this.modification()

        await amendment.getApplied()

        let content = await ContentManager.getInstance().getSpecificByID(amendment.newParent)

        let finalSeqNumber = this.getSeqNumber();

        while (!content.checkSeqNumberVacant(finalSeqNumber)) {
            finalSeqNumber += 1;
        }

        if (finalSeqNumber !== this.getSeqNumber()) {
            await prisma.content.update({
                where: {
                    ID: this.getID()
                },
                data: {
                    seqNumber: finalSeqNumber
                }
            })
        }

        await prisma.chapter.update({
            where: {
                ContentID: this.getID()
            },
            data: {
                CourseID: content.getSpecificID()
            }
        })

        this.addAmendment(amendment)
    }

    public async applyListAmendment(amendment: ListAmendment) {
        await this.modification()

        await amendment.getApplied()

        let idsToNewSQMap = new Map<number, number>();

        this.sortChildern();

        for (let change of amendment.changes) {
            let found = false;
            this.children.forEach((lesson, key) => {
                if (lesson.getID() === change.ChildID && !found) {
                    found = true;
                    if (change.newSeqNumber) {
                        if (this.children.has(change.newSeqNumber)) {
                            throw new SequenceNumberTaken
                        }

                        idsToNewSQMap.set(lesson.getID(), change.newSeqNumber)
                        this.children.set(change.newSeqNumber, lesson)
                    }
                    this.children.delete(key)
                    if (change.delete) {
                        lesson.hide()
                    }
                }
            })
            if (!found) {
                throw new NotFoundException("Child", change.ChildID ? change.ChildID : -1)
            }
        }

        for (let ID of Array.from(idsToNewSQMap.keys())) {
            let seqNum = idsToNewSQMap.get(ID);
            await prisma.content.update({
                where: {
                    ID: ID
                },
                data: {
                    seqNumber: seqNum
                }
            })
        }

        this.sortChildern();
        this.balanced = false;
        await this.balance(); //TODO in the future it will not be always called

        this.addAmendment(amendment)
    }

    public async balance() {
        if (!this.balanced) {
            this.sortChildern()
            let childrenCopy = new Map<number, Lesson>(this.children);
            let childernKeys = Array.from(this.children.keys());

            let patern = 32;
            let overwritten = false;
            for (let seq of childernKeys) {
                if (seq !== patern) {
                    let child = childrenCopy.get(seq)
                    if (child) {
                        if (!overwritten) {
                            this.children.delete(seq)
                        }
                        overwritten = this.children.has(patern)
                        child.setSeqNumber(patern)
                        this.children.set(patern, child)

                        await prisma.content.update({
                            where: {
                                ID: child!.getID()
                            },
                            data: {
                                seqNumber: patern
                            }
                        })
                    }
                }
                patern += 32;
            }
        }
    }

    public addChild(seqNum: number, child: Lesson) {
        if (!this.children.has(seqNum)) {
            this.children.set(seqNum, child)
            this.sortChildern();
            this.balanced = false;
        } else {
            throw new SequenceNumberTaken();
        }
    }

    public checkSeqNumberVacant(newSeqNumber: number) {
        return !this.children.has(newSeqNumber)
    }

    public async checkPaternity(ids: { ChildID?: number, LessonPartID?: number, newSeqNumber?: number, delete: boolean }[]): Promise<boolean> {
        let justIDs: number[] = [];

        this.children.forEach((child) => {
            justIDs.push(child.getID())
        })

        for (let id of ids) {
            if (id.ChildID) {
                if (justIDs.indexOf(id.ChildID) < 0) {
                    return false
                }
            } else {
                return false
            }
        }
        return true
    }

    public checkIfFullyFetched(): boolean {
        return true;
    }

    public getContentShareOfUser(userID: number): contentShareOutput[] {
        let output = this.getContentShareOfUserOneLevel(userID);

        return this.parent.getContentShareOfUser(userID).concat([{
            level: ContentType.CHAPTER,
            maximum: output[1],
            owned: output[0]
        }])
    }

    public getContentShareOfUserOneLevel(userID: number): [number, number] {
        let total = 0;
        let totalOverall = 0;

        this.amendments.forEach((amendment) => {
            if (amendment.getValueOfApplied()) {
                if (amendment.getAuthorID() === userID) {
                    total += amendment.getSignificance();
                }
                totalOverall += amendment.getSignificance();
            }
        })

        this.children.forEach((child) => {
            let output = child.getContentShareOfUserOneLevel(userID)
            total += output[0]
            totalOverall += output[1]
        })

        return [total, totalOverall]
    }
}

export default Chapter;