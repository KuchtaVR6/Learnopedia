import Content, {contentShareOutput, ContentType, FullOutput, MetaOutput} from "./Content";
import CreationAmendment from "../amendments/CreationAmendment";
import {ActiveKeyword} from "./keywords/Keyword";
import Amendment from "../amendments/Amendment";
import Chapter, {ChapterOutput} from "./Chapter";
import {CourseHasNoParent, SequenceNumberTaken} from "../tools/Errors";
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
                type: ContentType,
                numberAuthors : number
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

    public async getAuthors() : Promise<Map<number, number>> {
        this.authorsCache = await super.getAuthors()

        for(let childKey of Array.from(this.children.keys()))
        {
            let child = this.children.get(childKey)!
            let fromChild = await child.getAuthors()

            fromChild.forEach((elem, key) => {
                if(this.authorsCache)
                {
                    let initNum = this.authorsCache.get(key)
                    if(initNum)
                    {
                        this.authorsCache.set(key,elem + initNum)
                    }
                    else{
                        this.authorsCache.set(key,elem)
                    }
                }
            })
        }

        return this.authorsCache
    }

    protected async getNumberOfAuthors() : Promise<number> {
        if(!this.authorsCache)
        {
            await this.getAuthors()
        }

        let newNum = this.authorsCache!.size

        if (newNum != this.numberAuthorsFromDB){
            this.numberAuthorsFromDB = newNum
            await prisma.content.update({
                where : {
                    ID : this.getID()
                },
                data : {
                    numberOfAuthors : this.numberAuthorsFromDB
                }
            })
        }

        return this.numberAuthorsFromDB
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

        for(let ID of Array.from(idsToNewSQMap.keys())) {
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

        this.sortChildern()
        this.balanced = false

        await this.balance() //todo in the future not always

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
            let childrenCopy = new Map<number,Chapter>(this.children)
            let childrenKeys = Array.from(this.children.keys());

            let patern = 32;
            let overwritten = false;
            for (let seq of childrenKeys) {
                if (seq !== patern) {
                    let child = childrenCopy.get(seq)
                    if(child) {
                        if(!overwritten) {
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

    public checkSeqNumberVacant(newSeqNumber : number) {
        return this.children.has(newSeqNumber)
    }

    public async checkPaternity(ids : { ChildID?: number, LessonPartID? : number, newSeqNumber?: number, delete: boolean }[]) : Promise<boolean> {

        let justIDs : number[]= [];

        this.children.forEach((child) => {
            justIDs.push(child.getID())
        })

        for(let id of ids) {
            if(id.ChildID) {
                if (justIDs.indexOf(id.ChildID) < 0) {
                    return false
                }
            }
            else{
                return false
            }
        }
        return true
    }

    public checkIfFullyFetched() : boolean{
        return true;
    }

    public getContentShareOfUser(userID : number) : contentShareOutput[]{
        let output = this.getContentShareOfUserOneLevel(userID);

        return [{
            level: ContentType.COURSE,
            maximum: output[1],
            owned: output[0]
        }]
    }

    public getContentShareOfUserOneLevel(userID : number) : [number, number]{
        let total = 0;
        let totalOverall = 0;

        this.amendments.forEach((amendment) => {
            if(amendment.getAuthorID() === userID)
            {
                total += amendment.getSignificance();
            }
            totalOverall += amendment.getSignificance();
        })

        this.children.forEach((child) => {
            let output = child.getContentShareOfUserOneLevel(userID)
            total += output[0]
            totalOverall += output[1]
        })

        return [total, totalOverall]
    }
}