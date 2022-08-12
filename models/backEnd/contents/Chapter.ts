import Content, {ContentType, FullOutput, MetaOutput} from "./Content";
import Lesson, {LessonOutput} from "./Lesson";
import {Course, CourseOutput} from "./Course";
import CreationAmendment from "../amendments/CreationAmendment";
import {ActiveKeyword} from "./keywords/Keyword";
import Amendment from "../amendments/Amendment";
import {ContentNotFetched, NotFoundException, SequenceNumberTaken} from "../tools/Errors";
import AdoptionAmendment from "../amendments/AdoptionAmendment";
import prisma from "../../../prisma/prisma";
import ListAmendment from "../amendments/ListAmendment";
import ContentManager from "./ContentManager";

export type ChapterOutput = {
    meta : MetaOutput,
    lessons : MetaOutput[]
}

class Chapter extends Content {
    private parent: Course;
    private children: Map<number, Lesson>;
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
        parent: Course,
        children?: Map<number, Lesson> | Lesson[]
    ) {
        super(id, specificID, data);

        this.balanced = true;
        this.parent = parent;

        if (children) {
            if (children instanceof Map) {
                this.children = children;
            } else {
                this.children = new Map<number, Lesson>;

                children.map((child) => {
                    this.children.set(child.getSeqNumber(), child);
                })
            }
        } else {
            this.children = new Map<number, Lesson>;
        }
        this.sortChildern();
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

        return this.parent.fullRead();
    }

    public async getChapterOutput() : Promise<ChapterOutput>{
        let childrenResults: MetaOutput[] = [];

        for(let child of Array.from(this.children.values())) {
            childrenResults.push(await child.getMeta())
        }

        return {
            meta : await this.getMeta(),
            lessons : childrenResults
        }
    }

    public getType() {
        return ContentType.CHAPTER;
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

        for (let change of amendment.changes)
        {
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
            if(!found)
            {
                throw new NotFoundException("Child",change.ChildID)
            }
        }

        await idsToNewSQMap.forEach( async (seqNum, ID) => {
            await prisma.content.update({
                where: {
                    ID: ID
                },
                data: {
                    seqNumber: seqNum
                }
            })
        })

        this.sortChildern();
        this.balanced = false;
        await this.balance(); //TODO in the future it will not be always called

        this.addAmendment(amendment)
    }

    public async balance() {
        if (!this.balanced) {
            this.sortChildern()
            console.log("sorted")
            let childernCopy = Array.from(this.children.keys());

            let patern = 32;
            for(let seq of childernCopy){
                if (seq !== patern) {
                    let child = this.children.get(seq)
                    this.children.delete(seq)

                    child!.setSeqNumber(patern)
                    this.children.set(patern, child!)
                    console.log(patern," -> ",child)

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

    public addChild(seqNum: number, child: Lesson) {
        if (!this.children.has(seqNum)) {
            this.children.set(seqNum, child)
            this.sortChildern();
            this.balanced = false;
        } else {
            throw new SequenceNumberTaken();
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

export default Chapter;