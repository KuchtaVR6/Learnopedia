import Content, {contentShareOutput, ContentType, FullOutput} from "./Content";
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
import {Embeddable} from "../lessonParts/Embeddable";
import {QuizQuestion} from "../lessonParts/QuizQuestion";

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
                type: ContentType,
                numberAuthors : number
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
                embeddable: true,
                paragraph: true,
                quizquestion: {
                    include : {
                        answer : true
                    }
                }
            }
        })

        result.map((row) => {
            if (row.paragraph) {
                this.children.set(row.seqNumber, new Paragraph(row.LessonPartID, row.seqNumber, row.paragraph.basicText, row.paragraph.advancedText))
            }
            else if(row.embeddable)
            {
                this.children.set(row.seqNumber, new Embeddable(row.LessonPartID,row.seqNumber,row.embeddable.uri,row.embeddable.type))
            }
            else if(row.quizquestion)
            {
                this.children.set(row.seqNumber, new QuizQuestion(
                    row.LessonPartID,
                    row.seqNumber,
                    row.quizquestion.question,
                    row.quizquestion.type,
                    row.quizquestion.answer.map(
                        (each) =>
                        {return {
                            answerID : each.AnswerID,
                            content : each.content,
                            feedback : each.feedback? each.feedback : undefined,
                            correct : each.correct
                        }}))
                )
            }
            else {
                throw UnsupportedOperation;
            }
        })
        this.sortChildern()
        this.partsFetched = true;
    }

    public view() {
        super.view()

        this.parent.view()
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

    private sortChildern() {
        this.children = new Map(Array.from(this.children.entries()).sort((a, b) => {
            if (a[0] < b[0]) {
                return -1
            } else /* excluded see Testing comment No. 5 */ /* istanbul ignore if */  if (a[0] == b[0]) {
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

        let finalSeqNumber = this.getSeqNumber()

        while(!content.checkSeqNumberVacant(finalSeqNumber)) {
            finalSeqNumber += 1;
        }

        if(finalSeqNumber !== this.getSeqNumber()) {
            await prisma.content.update({
                where: {
                    ID: this.getID()
                },
                data : {
                    seqNumber : finalSeqNumber
                }
            })
        }

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

        if(!this.partsFetched) {
            await this.fetchParts()
        }

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

    public async balance() {
        if (!this.balanced) {

            if(!this.partsFetched) {
                await this.fetchParts()
            }

            this.sortChildern()

            let childernCopy = new Map<number,LessonPart>(this.children);
            let childernKeys = Array.from(this.children.keys());

            let patern = 32;
            let overwritten = false;
            for (let seq of childernKeys) {
                if (seq !== patern) {
                    let child = childernCopy.get(seq)
                    if(child) {
                        if(!overwritten) {
                            this.children.delete(seq)
                        }
                        overwritten = this.children.has(patern)
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

            this.sortChildern()
        }
    }

    public async applyPartAddReplaceAmendment(amendment: PartAddReplaceAmendment) {

        if(!this.partsFetched){
            await this.fetchParts();
        }

        while (!amendment.getOldID() && this.children.has(amendment.getNewSeqNum())) {
            amendment.moveNewSeqNum();
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
        return !this.children.has(newSeqNumber);
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

    public async checkPaternity(ids : { ChildID?: number, LessonPartID? : number, newSeqNumber?: number, delete: boolean }[]) : Promise<boolean> {

        let justIDs : number[]= [];

        if(!this.partsFetched) {
            await this.fetchParts()
        }

        for(let seqNum of Array.from(this.children.keys())) {
            justIDs.push(this.children.get(seqNum)!.getID())
        }

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

    public getContentShareOfUser(userID : number) : contentShareOutput[]{
        let output = this.getContentShareOfUserOneLevel(userID);

        return this.parent.getContentShareOfUser(userID).concat([{
            level: ContentType.LESSON,
            maximum: output[1],
            owned: output[0]
        }])
    }

    public getContentShareOfUserOneLevel(userID : number) : [number, number]{
        let total = 0;
        let totalOverall = 0;

        this.amendments.forEach((amendment) => {
            if(amendment.getValueOfApplied()) {
                if (amendment.getAuthorID() === userID) {
                    total += amendment.getSignificance();
                }
                totalOverall += amendment.getSignificance();
            }
        })

        return [total, totalOverall]
    }
}

export default Lesson;