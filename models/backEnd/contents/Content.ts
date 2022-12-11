import {Expirable} from "../tools/Expirable";
import Amendment, {AmendmentOutput} from "../amendments/Amendment";
import CreationAmendment from "../amendments/CreationAmendment";
import MetaAmendment from "../amendments/MetaAmendment";
import {User} from "../User";
import Keyword, {ActiveKeyword} from "./keywords/Keyword";
import KeywordManager from "./keywords/KeywordManager";
import {ContentNotFetched, InvalidArgument, UnsupportedOperation} from "../tools/Errors";
import prisma from "../../../prisma/prisma";
import AdoptionAmendment from "../amendments/AdoptionAmendment";
import ListAmendment from "../amendments/ListAmendment";
import {displayableOutput} from "../lessonParts/LessonPart";
import {CourseOutput} from "./Course";
import PartAddReplaceAmendment from "../amendments/PartAmendments/PartAddReplaceAmendment";

export type FullOutput = {
    metas: CourseOutput,
    content?: displayableOutput[]
}

export type MetaOutput = {
    id: number,
    name: string,
    description: string,
    keywords: { ID: number, Score: number, word: string }[],
    creation: string,
    modification: string,
    type: ContentType,
    seqNumber: number,
    authors: string
}

export type LDNJSON = {
    "@context": string,
    "@type": string,
    headline: string,
    description: string,
    image: string,
    author: { "@type": string, name: string },
    publisher: { "@type": string, name: string, logo: { "@type": string, url: string } },
    datePublished: string, dateModified: string
}


class Content extends Expirable {

    private readonly id: number;
    private readonly specificID: number;

    private name: string;
    private description: string;
    private keywords: Keyword[];

    private viewsChanged: boolean;
    private views: number;
    private upVotes: number;
    private downVotes: number;
    private dateModified: Date;
    private readonly dateCreated: Date;

    private readonly type: ContentType;

    private seqNumber: number;

    private readonly amendments: Array<Amendment>;

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
            }) {

        super();

        this.id = id;
        this.specificID = specificID;
        this.viewsChanged = false;

        this.name = data.name;
        this.description = data.description;
        this.keywords = data.keywords;
        this.seqNumber = data.seqNumber;
        this.type = data.type;

        if (data instanceof CreationAmendment) {
            this.views = 0;
            this.upVotes = 0;
            this.downVotes = 0;
            this.dateCreated = new Date();
            this.dateModified = new Date();
            this.amendments = [data];
        } else {
            this.views = data.views;
            this.upVotes = data.upVotes;
            this.downVotes = data.downVotes;
            this.dateCreated = data.dateCreated;
            this.dateModified = data.dateModified;
            this.amendments = data.amendments;
        }
    }

    public async applyMetaAmendment(amendment: MetaAmendment) {

        await this.modification()

        await prisma.amendment.update({
            where: {
                ID: amendment.getID()
            },
            data: {
                applied: true
            }
        })

        let idsToConnect: number[] = [];
        let idsToDisconnect: number[] = [];

        if (amendment.deletedKeywords) {
            let newKeywords: Keyword[] = [];
            let changedFlag: boolean = false;

            let keywordManager = await KeywordManager.getInstance()

            this.keywords.map((keyword) => {
                if (amendment.deletedKeywords!.findIndex((elem) => elem.getWord() === keyword.getWord()) < 0) {
                    newKeywords.push(keyword)
                } else {
                    if (keyword instanceof ActiveKeyword) {
                        if ((keyword as ActiveKeyword).getContentID() !== this.id) {
                            throw new InvalidArgument("Keyword with id=" + keyword.getID().toString(), "Must be a keyword associated with the parent.")
                        }
                        keywordManager.deactivate(keyword);
                    }
                    idsToDisconnect.push(keyword.getID())
                    changedFlag = true;
                }
            })

            if (changedFlag) {
                this.keywords = newKeywords;
            }
        }
        if (amendment.addedKeywords) {
            let manager = await KeywordManager.getInstance()
            amendment.addedKeywords.map(async (keyword) => {
                if (this.keywords.findIndex((elem) => elem.getWord() === keyword.getWord()) < 0) {
                    idsToConnect.push(keyword.getID())
                    this.keywords.push(manager.activate(keyword, this.id))
                }
            })
        }

        await prisma.keyword.updateMany({
            where: {
                ID: {
                    in: idsToConnect
                }
            },
            data: {
                ContentID: this.id
            }
        })

        await prisma.keyword.updateMany({
            where: {
                ID: {
                    in: idsToDisconnect
                }
            },
            data: {
                ContentID: null
            }
        })

        if (amendment.newName) {
            this.name = amendment.newName;
        }

        if (amendment.newDescription) {
            this.description = amendment.newDescription;
        }

        await prisma.content.update({
            where: {
                ID: this.id
            },
            data: {
                name: this.name,
                description: this.description
            }
        })

        this.authorsCache = null;

        this.amendments.push(amendment);
    }

    public upVote() {
        this.upVotes += 1;
    }

    public downVote() {
        this.downVotes += 1;
    }

    public getOverallScore() {
        return this.upVotes - this.downVotes
    }

    public async modification() {
        this.dateModified = new Date();

        await prisma.content.update({
            where: {
                ID: this.id
            },
            data: {
                dateModified: this.dateModified
            }
        })
    }

    private static twoDigit(input: number) {
        if (input < 10) {
            return "0" + input.toString()
        }
        return input.toString()
    }

    public getCreationDate() {
        return this.dateCreated.getFullYear() + "." + Content.twoDigit(this.dateCreated.getMonth() + 1)  + "." +  Content.twoDigit(this.dateCreated.getDate())
    }

    public getModificationDate() {
        return this.dateModified.getFullYear() + "." + Content.twoDigit(this.dateModified.getMonth() + 1) + "." +  Content.twoDigit(this.dateModified.getDate())
    }

    public async getLDJSON(): Promise<LDNJSON> { //todo in the future remove
        return (
            {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": this.name,
                "description": this.description,
                "image": "",
                "author": {
                    "@type": "Organization",
                    "name": await this.getAuthorsFormatted()
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "Learnopedia",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://learnopedia.org/images/logo.png"
                    }
                },
                "datePublished": this.getCreationDate(),
                "dateModified": this.getModificationDate()
            }
        )
    }

    public async getMeta(): Promise<MetaOutput> {
        let outputKeywords: { ID: number, Score: number, word: string }[] = [];
        this.keywords.map((keyword) => {
            outputKeywords.push({ID: keyword.getID(), Score: keyword.getScore(), word: keyword.getWord()})
        })

        return {
            id: this.id,
            name: this.name,
            description: this.description,
            keywords: outputKeywords,
            type: this.type,
            seqNumber: this.seqNumber,
            creation: this.getCreationDate(),
            modification: this.getModificationDate(),
            authors: await this.getAuthorsFormatted()
        }
    }

    private async getAuthorsFormatted() {
        if (!this.authorsCache) {
            await this.getAuthors()
        }

        let num = this.authorsCache?.size

        if (num === 1 || num==0) {
            return "Created by one author"
        }
        return "Created by " + this.authorsCache?.size + " authors"
    }

    private authorsCache: Map<User, number> | null = null;

    public async getAuthors() {
        if (!this.authorsCache) {
            this.authorsCache = new Map<User, number>();

            for(let amendment of this.amendments) {
                let author = await amendment.getAuthor()

                let initNum = this.authorsCache?.get(author)
                if (initNum) {
                    this.authorsCache?.set(author, initNum + amendment.getSignificance())
                } else {
                    this.authorsCache?.set(author, amendment.getSignificance())
                }
            }
        }
    }

    public getSignificance() {
        if (this.downVotes === 0) {
            let x = this.upVotes * this.views
            if(x < 1)
            {
                return 1;
            }
            return x;
        }
        let x = (((this.upVotes - this.downVotes) / this.downVotes) + 1) * this.views
        if(x < 1)
        {
            return 1;
        }
        return x;
    }

    public getID() {
        return this.id;
    }

    public getSeqNumber() {
        return this.seqNumber
    }

    public async fullRead(): Promise<FullOutput> {
        throw ContentNotFetched;
    }

    public getType(): ContentType {
        return this.type;
    }

    public async getAdopted(amendment: AdoptionAmendment) {
        throw ContentNotFetched;
    }

    public applyListAmendment(amendment: ListAmendment) {
        throw new ContentNotFetched
    }

    public async hide() {
        await prisma.content.update({
            where: {
                ID: this.id
            },
            data: {
                public: false
            }
        })
    }

    public addAmendment(amendment: Amendment) {
        this.amendments.push(amendment)
    }

    public async getAmendmentsOutput() {
        let outputs : AmendmentOutput[] = [];

        for(let amendment of this.amendments)
        {
            outputs.push(await amendment.getFullAmendmentOutput())
        }

        return outputs;
    }

    public setSeqNumber(seqNumber: number) {
        this.seqNumber = seqNumber;
    }

    protected view() {
        this.viewsChanged = true;
        this.views += 1;
    }

    private saveViews() {
        if (this.viewsChanged) {
            this.viewsChanged = false;
            prisma.content.update({
                where: {
                    ID: this.id
                },
                data: {
                    views: this.views
                }
            })
        }
    }

    public onDeath() {
        this.saveViews()
    }

    public onNudge() {
        this.saveViews()
    }

    public checkSeqNumberVacant(newSeqNumber: number): boolean {
        throw ContentNotFetched;
    }

    public getSpecificID() {
        return this.specificID;
    }

    public async applyPartAddReplaceAmendment(amendment: PartAddReplaceAmendment) {
        throw new UnsupportedOperation("Non-Lesson Content", "applyPartAddReplaceAmendment")
    }

    public checkPaternity(ids: { ChildID?: number, LessonPartID? : number, newSeqNumber?: number, delete: boolean }[]): boolean {
        throw ContentNotFetched
    }

    public checkIfFullyFetched() : boolean{
        return false;
    }
}


export enum ContentType {
    COURSE,
    CHAPTER,
    LESSON
}

export default Content;