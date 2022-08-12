import Content, {ContentType, FullOutput, MetaOutput} from "./Content";
import CreationAmendment from "../amendments/CreationAmendment";
import {ActiveKeyword} from "./keywords/Keyword";
import Amendment from "../amendments/Amendment";
import Chapter, {ChapterOutput} from "./Chapter";
import {ContentNotFetched, CourseHasNoParent, SequenceNumberTaken} from "../tools/Errors";
import AdoptionAmendment from "../amendments/AdoptionAmendment";
import ListAmendment from "../amendments/ListAmendment";
import prisma from "../../../prisma/prisma";

export type CourseOutput = {
    meta: MetaOutput
    chapters: ChapterOutput[]
}

export class Course extends Content {
    private children: Map<number, Chapter>;
    private balanced: boolean;

    public constructor(
        id: number,
        specificID : number,
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
        children?: Map<number, Chapter> | Chapter[]
    ) {
        super(id, specificID, data);

        this.balanced = true

        if (children) {
            if (children instanceof Map) {
                this.children = children;
            } else {
                this.children = new Map<number, Chapter>;

                children.map((child) => {
                    this.children.set(child.getSeqNumber(), child);
                })
            }
        } else {
            this.children = new Map<number, Chapter>;
        }

        this.sortChildern()
    }

    private sortChildern() {
        this.children = new Map(Array.from(this.children.entries()).sort((a, b) => {
            if (a[0] < b[0])
            {
                return -1
            }
            else if (a[0] == b[0])
            {
                return 0
            }
            else{
                return 1
            }
        }));
    }

    public async fullRead(): Promise<FullOutput> {
        super.view()

        let childrenResults: ChapterOutput[] = [];

        for (let child of Array.from(this.children.values())) {
            childrenResults.push(await child.getChapterOutput())
        }

        return {
            metas:
                {
                    meta: await this.getMeta(),
                    chapters: childrenResults
                },
        }
    }

    public getType() {
        return ContentType.COURSE;
    }

    public async getAdopted(amendment: AdoptionAmendment) {
        throw new CourseHasNoParent()
    }

    public async applyListAmendment(amendment: ListAmendment) {
        await this.modification()

        await amendment.getApplied()

        let idsToNewSQMap = new Map<number, number>();

        amendment.changes.map(async (change) => {
            this.children.forEach((chapter, key) => {
                if (chapter.getID() === change.ChildID) {
                    if (change.newSeqNumber) {
                        if (this.children.has(change.newSeqNumber)) {
                            throw new SequenceNumberTaken
                        }

                        idsToNewSQMap.set(chapter.getID(), change.newSeqNumber)
                        this.children.set(change.newSeqNumber, chapter)
                    }
                    this.children.delete(key)
                    if (change.delete) {
                        chapter.hide()
                    }
                }
            })
        })

        idsToNewSQMap.forEach((seqNum, ID) => {
            prisma.content.update({
                where: {
                    ID: ID
                },
                data: {
                    seqNumber: seqNum
                }
            })
        })

        this.sortChildern()
        this.balanced = false

        await this.balance() //todo not always in the future

        this.addAmendment(amendment)
    }

    public addChild(seqNum: number, child: Chapter) {
        if (!this.children.has(seqNum)) {
            this.children.set(seqNum, child)
            this.sortChildern()
            this.balanced = false;
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

                    await prisma.content.update({
                        where: {
                            ID: child!.getID()
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

    public checkSeqNumberVacant(newSeqNumber : number) {
        return this.children.has(newSeqNumber)
    }

    public checkPaternity(ids : { ChildID: number, newSeqNumber?: number, delete: boolean }[]) : boolean {

        let justIDs : number[]= [];

        this.children.forEach((child) => {
            justIDs.push(child.getID())
        })

        for(let id of ids) {
            if(justIDs.indexOf(id.ChildID)<0)
            {
                return false
            }
        }
        return true
    }

    public checkIfFullyFetched() : boolean{
        return true;
    }
}