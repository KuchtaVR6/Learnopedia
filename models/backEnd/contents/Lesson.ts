import Content, {ContentType, FullOutput} from "./Content";
import CreationAmendment from "../amendments/CreationAmendment";
import {ActiveKeyword} from "./keywords/Keyword";
import Amendment from "../amendments/Amendment";
import Chapter from "./Chapter";
import LessonPart, {displayableOutput} from "../lessonParts/LessonPart";
import AdoptionAmendment from "../amendments/AdoptionAmendment";
import prisma from "../../../prisma/prisma";
import ListAmendment from "../amendments/ListAmendment";
import {
    InvalidArgument,
    MissingLessonPart,
    NotFoundException,
    SequenceNumberTaken,
    UnsupportedOperation
} from "../tools/Errors";
import Paragraph from "../lessonParts/Paragraph";
import PartAddReplaceAmendment from "../amendments/PartAmendments/PartAddReplaceAmendment";
import LessonPartManager from "../lessonParts/LessonPartManager";
import ContentManager from "./ContentManager";

class Lesson extends Content {
    private parent: Chapter;
    private children: Map<number, LessonPart>;
    private partsFetched: boolean;
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
                type: ContentType
            },
        parent: Chapter,
    ) {
        super(id, specificID, data);

        this.parent = parent;
        this.balanced = true;

        this.partsFetched = false;
        this.children = new Map<number, LessonPart>;
    }

    private async fetchParts() {
        let result = await prisma.lessonpart.findMany({
            where: {
                LessonID: this.getSpecificID()
            },
            include: {
                protocolsnippet: true,
                paragraph: true,
                figure: {
                    include: {
                        subfigure: true
                    }
                },
                video: true
            }
        })

        result.map((row) => {
            if (row.paragraph) {
                this.children.set(row.seqNumber, new Paragraph(row.LessonPartID, row.seqNumber, row.paragraph.basicText, row.paragraph.advancedText))
            } else {
                //TODO (when more types are added)
            }
        })

        this.sortChildern()
        this.partsFetched = true;
    }

    public view() {
        super.view()

        this.parent.view()
    }

    private sortChildern() {
        this.children = new Map(Array.from(this.children.entries()).sort((a, b) => {
            if (a[0] < b[0]) {
                return -1
            } else if (a[0] == b[0]) {
                return 0
            } else {
                return 1
            }
        }));
    }

    public async fullRead(): Promise<FullOutput> {


        if (!this.partsFetched) {
            await this.fetchParts()
        }

        let partsDisplay: displayableOutput[] = [];

        this.children.forEach((part) => {
            partsDisplay.push(part.getDisplayable())
        })

        let output = await this.parent.fullRead();

        output["content"] = partsDisplay;

        return output;
    }

    public getType() {
        return ContentType.LESSON;
    }

    public async getAdopted(amendment: AdoptionAmendment) {
        await this.modification()

        await amendment.getApplied()

        let content = await ContentManager.getInstance().getSpecificByID(amendment.newParent)

        await prisma.amendment.update({
            where: {
                ID: amendment.getID()
            },
            data: {
                applied: true
            }
        })

        await prisma.lesson.update({
            where: {
                ContentID: this.getID()
            },
            data: {
                ChapterID: content.getSpecificID()
            }
        })

        this.addAmendment(amendment)
    }

    public async applyListAmendment(amendment: ListAmendment) {
        await this.modification()

        await amendment.getApplied()

        let idsToNewSQMap = new Map<number, number>();

        this.sortChildern();

        for (let change of amendment.changes)
        {
            if(change.LessonPartID && (change.delete || change.LessonPartID)) {
                let found = false;
                this.children.forEach((lessonPart, key) => {
                    if (lessonPart.getID() === change.LessonPartID && !found) {
                        found = true;
                        if (change.newSeqNumber) {
                            if (this.children.has(change.newSeqNumber)) {
                                throw new SequenceNumberTaken
                            }

                            lessonPart.setSeqNumber(change.newSeqNumber)
                            idsToNewSQMap.set(lessonPart.getID(), change.newSeqNumber)
                            this.children.set(change.newSeqNumber, lessonPart)
                        }
                        this.children.delete(key)
                        if (change.delete) {
                            lessonPart.hide()
                        }
                    }
                })
                if (!found) {
                    throw new NotFoundException("Child", change.LessonPartID ? change.LessonPartID : -1)
                }
            }
            else{
                throw new InvalidArgument("Changes on Lesson", "Need LessonPartID, then delete or newSeqNumber")
            }
        }

        for(let ID of Array.from(idsToNewSQMap.keys())) {
            let seqNum = idsToNewSQMap.get(ID);
            if (seqNum) {
                await prisma.lessonpart.update({
                    where: {
                        LessonPartID: ID
                    },
                    data: {
                        seqNumber: seqNum
                    }
                });
            }
        }


        await this.sortChildern();
        this.balanced = false;
        await this.balance(); //TODO in the future it will not be always called

        this.addAmendment(amendment)
    }

    public addChild(seqNum: number, child: LessonPart) {
        if (!this.children.has(seqNum)) {
            this.children.set(seqNum, child)
            this.balanced = false;
            this.sortChildern()
        } else {
            throw new SequenceNumberTaken();
        }
    }

    public async balance() {
        if (!this.balanced) {
            this.sortChildern()
            let childernCopy = new Map<number,LessonPart>(this.children);
            let childernKeys = Array.from(this.children.keys());

            let patern = 32;
            for (let seq of childernKeys) {
                if (seq !== patern) {
                    let child = childernCopy.get(seq)
                    if(child) {
                        this.children.delete(seq)

                        child.setSeqNumber(patern)
                        this.children.set(patern, child)

                        await prisma.lessonpart.update({
                            where: {
                                LessonPartID: child.getID()
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

    public async applyPartAddReplaceAmendment(amendment: PartAddReplaceAmendment) {

        if (!amendment.getOldID() && this.children.has(amendment.getNewSeqNum())) {
            throw new SequenceNumberTaken();
        }

        if (!amendment.getLessonPartID()) {
            throw MissingLessonPart
        }

        await this.modification()

        await amendment.getApplied()

        let newPartId = amendment.getLessonPartID()
        if (!newPartId) {
            throw new InvalidArgument("LessonPart for add/replace", "Has not been deleted")
        }

        if (amendment.getOldID()) {
            let found = false

            let oldId = amendment.getOldID()

            for (let child of Array.from(this.children.values())) {
                if (!found && child.getID() === oldId) {
                    this.children.delete(child.getSeqNumber())

                    this.children.set(child.getSeqNumber(), await LessonPartManager.getInstance().retrieve(newPartId))

                    await prisma.lessonpart.update({
                        where: {
                            LessonPartID: child.getID()
                        },
                        data: {
                            LessonID: null
                        }
                    })

                    await prisma.lessonpart.update({
                        where: {
                            LessonPartID: newPartId
                        },
                        data: {
                            LessonID: this.getSpecificID()
                        }
                    })
                    await child.hide();

                    found = true;
                }
            }
        } else {
            let newPart = await LessonPartManager.getInstance().retrieve(newPartId)
            if(this.children.has(amendment.getNewSeqNum()))
            {
                throw new SequenceNumberTaken()
            }
            this.children.set(amendment.getNewSeqNum(), newPart)

            await prisma.lessonpart.update({
                where: {
                    LessonPartID: newPart.getID()
                },
                data: {
                    LessonID: this.getSpecificID()
                }
            })
        }

        this.sortChildern()
        this.balanced = false;
        await this.balance() //TODO in the future not called always

        this.addAmendment(amendment)
    }

    public checkSeqNumberVacant(newSeqNumber: number): boolean {
        return this.children.has(newSeqNumber);
    }

    public getLessonPartByID(id: number): LessonPart {
        let result: LessonPart | undefined = undefined;

        this.children.forEach((child) => {
            if (child.getID() === id) {
                result = child
            }
        })

        if (result) {
            return result
        } else {
            throw new NotFoundException("LessonPart", id)
        }
    }

    public checkPaternity(ids : { ChildID?: number, LessonPartID? : number, newSeqNumber?: number, delete: boolean }[]) : boolean {

        let justIDs : number[]= [];

        this.children.forEach((child) => {
            justIDs.push(child.getID())
        })

        for(let id of ids) {
            if(id.LessonPartID) {
                if (justIDs.indexOf(id.LessonPartID) < 0) {
                    return false
                }
            }
            else{
                return false
            }
        }
        return true
    }

    public checkIfFullyFetched(): boolean {
        return true;
    }
}

export default Lesson;