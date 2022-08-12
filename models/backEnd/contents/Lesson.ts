import Content, {ContentType, FullOutput, MetaOutput} from "./Content";
import CreationAmendment from "../amendments/CreationAmendment";
import {ActiveKeyword} from "./keywords/Keyword";
import Amendment from "../amendments/Amendment";
import Chapter from "./Chapter";
import LessonPart, {displayableOutput} from "../lessonParts/LessonPart";
import AdoptionAmendment from "../amendments/AdoptionAmendment";
import prisma from "../../../prisma/prisma";
import ListAmendment from "../amendments/ListAmendment";
import {
    MissingLessonPart,
    NotFoundException,
    SequenceNumberTaken,
    UnsupportedOperation
} from "../tools/Errors";
import Paragraph from "../lessonParts/Paragraph";
import PartDeletionAmendment from "../amendments/PartAmendments/PartDeletionAmendment";
import PartInsertAmendment from "../amendments/PartAmendments/PartInsertAmendment";
import PartModificationAmendment from "../amendments/PartAmendments/PartModificationAmendment";
import LessonPartManager from "../lessonParts/LessonPartManager";
import ContentManager from "./ContentManager";

export type LessonOutput = {
    meta: MetaOutput
}

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
        let result = await prisma.lessonparts.findMany({
            where: {
                LessonID: this.getSpecificID()
            },
            include: {
                protocol_snippet: true,
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
        this.view()

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

    public applyListAmendment(amendment: ListAmendment) {
        throw new UnsupportedOperation("Lesson", "applyListAmendment")
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
            let childernCopy = Array.from(this.children.keys());

            let patern = 32;
            for (let seq of childernCopy) {
                if (seq !== patern) {
                    let child = this.children.get(seq)
                    this.children.delete(seq)

                    child!.setSeqNumber(patern)
                    this.children.set(patern, child!)

                    await prisma.lessonparts.update({
                        where: {
                            LessonPartID: child!.getID()
                        },
                        data: {
                            seqNumber: patern
                        }
                    })
                }
                patern += 32;
            }
        }
    }

    public async applyPartDeletionAmendment(amendment: PartDeletionAmendment) {

        if (!amendment.getLessonPartID()) {
            throw MissingLessonPart
        }

        await this.modification()

        await amendment.getApplied()

        let id = amendment.getLessonPartID()!
        let found = false

        this.children.forEach((child) => {
            if (!found && child.getID() === id) {
                this.children.delete(child.getSeqNumber())
                found = true;
            }
        })

        if (found) {
            await prisma.lessonparts.update({
                where: {
                    LessonPartID: id
                },
                data: {
                    LessonID: null
                }
            })
        }

        this.addAmendment(amendment)
    }

    public async applyPartInsertAmendment(amendment: PartInsertAmendment) {

        if (this.children.has(amendment.getNewSeqNum())) {
            throw new SequenceNumberTaken();
        }

        if (!amendment.getLessonPartID()) {
            throw MissingLessonPart
        }

        await this.modification()

        await amendment.getApplied()

        let id = amendment.getLessonPartID()

        if (amendment.isMove()) {
            let found = false

            for (let child of Array.from(this.children.values())) {
                if (!found && child.getID() === id) {
                    this.children.set(amendment.getNewSeqNum(), child)

                    child.setSeqNumber(amendment.getNewSeqNum())

                    await prisma.lessonparts.update({
                        where: {
                            LessonPartID: child.getID()
                        },
                        data: {
                            seqNumber: amendment.getNewSeqNum()
                        }
                    })

                    this.children.delete(child.getSeqNumber())
                    found = true;
                }
            }
        } else {

            if (amendment.getLessonPartID()) {
                let newPart = await LessonPartManager.getInstance().retrieve(amendment.getLessonPartID()!)
                this.children.set(amendment.getNewSeqNum(), newPart)

                await prisma.lessonparts.update({
                    where: {
                        LessonPartID: newPart.getID()
                    },
                    data: {
                        LessonID: this.getSpecificID()
                    }
                })
            } else {
                throw MissingLessonPart
            }
        }

        this.sortChildern()
        this.balanced = false;
        await this.balance() //TODO in the future not called always

        this.addAmendment(amendment)
    }

    public async applyPartModificationAmendment(amendment: PartModificationAmendment) {
        if (!amendment.getLessonPartID()) {
            throw MissingLessonPart
        }

        await this.modification()

        await amendment.getApplied()

        let id = amendment.getLessonPartID()!
        let found = false

        for (let child of Array.from(this.children.values())) {
            if (!found && child.getID() === id) {
                this.children.set(child.getSeqNumber(), await LessonPartManager.getInstance().retrieve(amendment.getNewPartID()))

                found = true;
            }
        }

        if (found) {
            await prisma.lessonparts.update({
                where: {
                    LessonPartID: id
                },
                data: {
                    LessonID: null
                }
            })
            await prisma.lessonparts.update({
                where: {
                    LessonPartID: amendment.getNewPartID()
                },
                data: {
                    LessonID: this.getSpecificID()
                }
            })
        }

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

    public checkPaternity(ids: { ChildID: number, newSeqNumber?: number, delete: boolean }[]): boolean {
        throw new UnsupportedOperation("Lesson", "checkPaternity")
    }

    public checkIfFullyFetched(): boolean {
        return true;
    }
}

export default Lesson;