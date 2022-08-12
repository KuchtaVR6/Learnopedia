import SelfPurgingMap from "../tools/SelfPurgingMap";
import Content, {ContentType} from "./Content";
import {
    ContentNotFoundException,
    ContentNotNavigable,
    CourseHasNoParent,
    InvalidArgument,
    LessonCannotBeParent,
    NoChanges,
    OrphanedContent,
    SequenceNumberTaken,
    UnsupportedOperation,
    WrongParent
} from "../tools/Errors";
import Keyword, {ActiveKeyword} from "./keywords/Keyword";
import Amendment from "../amendments/Amendment";
import MetaAmendment from "../amendments/MetaAmendment";
import prisma from "../../../prisma/prisma";
import CreationAmendment from "../amendments/CreationAmendment";
import KeywordManager from "./keywords/KeywordManager";
import AdoptionAmendment from "../amendments/AdoptionAmendment";
import ListAmendment from "../amendments/ListAmendment";
import {amendment, keyword} from "@prisma/client";
import {Course} from "./Course";
import Chapter from "./Chapter";
import Lesson from "./Lesson";
import PartDeletionAmendment from "../amendments/PartAmendments/PartDeletionAmendment";
import LessonPartManager, {lessonPartArgs} from "../lessonParts/LessonPartManager";
import PartModificationAmendment from "../amendments/PartAmendments/PartModificationAmendment";
import PartInsertAmendment from "../amendments/PartAmendments/PartInsertAmendment";

class ContentManager {
    private static instance: ContentManager | null = null;

    private cache: SelfPurgingMap<number, Content>

    private constructor() {
        this.cache = new SelfPurgingMap<number, Content>();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new ContentManager();
        }
        return this.instance;
    }

    public async getContentByID(id: number): Promise<Content> {
        let fromCache = this.cache.get(id);
        if (fromCache) {
            return fromCache
        } else {
            return this.partialFetchAndCache({ID: id, public: true});
        }
    }

    public async getSpecificByID(id: number): Promise<Content> {
        let fromCache = this.cache.get(id);
        if (fromCache) {
            if(fromCache.checkIfFullyFetched())
            {
                return fromCache
            }
        }
        return this.fullFetchAndCache({ID: id, public: true});
    }

    private async partialFetchAndCache(where: { ID: number, public: true }): Promise<Content> {

        let dbResult = await prisma.content.findFirst({
            where: where,
            include: {
                amendment: true,
                keyword: true,

                lesson: true,
                chapter: true,
                course: true
            }
        })
        if (dbResult) {
            if (dbResult.public) {
                let keywordsArray: ActiveKeyword[] = []
                dbResult.keyword.map((keyword) => {
                    keywordsArray.push(new ActiveKeyword(keyword.ID, keyword.Score, keyword.word, dbResult!.ID))
                })

                let amendmentsArray: Amendment[] = []
                dbResult.amendment.map((amendment) => {
                    amendmentsArray.push(new Amendment(amendment.ID, amendment.CreatorID, amendment.ContentID!, amendment.timestamp))
                })

                let type: ContentType;
                let specificID : number;

                if (dbResult.lesson.length > 0) {
                    type = ContentType.LESSON
                    specificID = dbResult.lesson[0].LessonID
                } else if (dbResult.course.length > 0) {
                    type = ContentType.COURSE
                    specificID = dbResult.course[0].CourseID
                } else if (dbResult.chapter.length > 0) {
                    type = ContentType.CHAPTER
                    specificID = dbResult.chapter[0].ChapterID
                } else {
                    throw new Error("UNCLASSIFIED CONTENT CRITICAL")
                }

                let content = new Content(
                    dbResult.ID,
                    specificID,
                    {
                        name: dbResult.name,
                        description: dbResult.description,
                        dateCreated: dbResult.dateCreated,
                        dateModified: dbResult.dateModified,
                        downVotes: dbResult.downVotes,
                        upVotes: dbResult.upVotes,
                        views: dbResult.views,
                        seqNumber: dbResult.seqNumber,
                        amendments: amendmentsArray,
                        keywords: keywordsArray,
                        type: type
                    })
                this.cache.set(dbResult.ID, content)

                return content;
            } else {
                throw new ContentNotNavigable();
            }
        } else {
            throw new ContentNotFoundException(where.ID)
        }
    }

    /*
    Fetches with the details specific to a type for example Course
     */
    private async fullFetchAndCache(where: { ID: number, public: true }): Promise<Content> {

        let dbResult = await prisma.content.findFirst({
            where: where,
            include: {
                amendment: true,
                keyword: true,

                lesson: {
                    include: {
                        chapter: {
                            include: {
                                course: {
                                    select: {
                                        ContentID: true
                                    }
                                }
                            }
                        }
                    }
                },
                chapter: {
                    include: {
                        course: {
                            select: {
                                ContentID: true
                            }
                        }
                    }
                },
                course: {
                    select: {
                        ContentID: true
                    }
                }
            }
        })
        if (dbResult) {
            if (dbResult.public) {
                let targetHost: number;

                if (dbResult.course.length > 0) {
                    targetHost = dbResult.course[0].ContentID
                } else if (dbResult.chapter.length > 0) {
                    targetHost = dbResult.chapter[0].course.ContentID
                } else if (dbResult.lesson.length > 0) {
                    targetHost = dbResult.lesson[0].chapter.course.ContentID
                } else {
                    throw new Error("UNCLASSIFIED CONTENT CRITICAL")
                }

                let dbFull = await prisma.content.findFirst({
                    where: {
                        ID: targetHost,
                        public : true
                    },
                    include: {
                        keyword: true,
                        amendment: true,

                        course: {
                            include: {
                                chapter: {
                                    include: {
                                        content: {
                                            include: {
                                                keyword: true,
                                                amendment: true,
                                            }
                                        },
                                        lesson: {
                                            include: {
                                                content: {
                                                    include: {
                                                        keyword: true,
                                                        amendment: true,
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                if (dbFull && dbFull.public) {
                    //caching the course
                    let KeywordsArray = this.interpretKeywords(dbFull.keyword, dbFull.ID);
                    let AmendmentsArray = this.interpretAmendments(dbFull.amendment);

                    let host = new Course(dbFull.ID, dbFull.course[0].CourseID, {
                        name: dbFull.name,
                        description: dbFull.description,
                        keywords: KeywordsArray,
                        views: dbFull.views,
                        upVotes: dbFull.upVotes,
                        downVotes: dbFull.downVotes,
                        dateModified: dbFull.dateModified,
                        dateCreated: dbFull.dateCreated,
                        amendments: AmendmentsArray,
                        seqNumber: dbFull.seqNumber,
                        type: ContentType.COURSE
                    })

                    this.cache.set(dbFull.ID, host)

                    dbFull.course[0].chapter.map((chapter) => {
                        if(chapter.content.public) {
                            let row = chapter.content

                            let KeywordsArray = this.interpretKeywords(row.keyword, row.ID);
                            let AmendmentsArray = this.interpretAmendments(row.amendment);

                            let newChapter = new Chapter(row.ID, chapter.ChapterID,
                                {
                                    name: row.name,
                                    description: row.description,
                                    keywords: KeywordsArray,
                                    views: row.views,
                                    upVotes: row.upVotes,
                                    downVotes: row.downVotes,
                                    dateModified: row.dateModified,
                                    dateCreated: row.dateCreated,
                                    amendments: AmendmentsArray,
                                    seqNumber: row.seqNumber,
                                    type: ContentType.CHAPTER
                                }, host)

                            host.addChild(row.seqNumber, newChapter)

                            this.cache.set(row.ID, newChapter)

                            chapter.lesson.map((lesson) => {
                                let row = lesson.content

                                if(row.public) {

                                    let KeywordsArray = this.interpretKeywords(row.keyword, row.ID);
                                    let AmendmentsArray = this.interpretAmendments(row.amendment);

                                    let newLesson = new Lesson(row.ID, lesson.LessonID,
                                        {
                                            name: row.name,
                                            description: row.description,
                                            keywords: KeywordsArray,
                                            views: row.views,
                                            upVotes: row.upVotes,
                                            downVotes: row.downVotes,
                                            dateModified: row.dateModified,
                                            dateCreated: row.dateCreated,
                                            amendments: AmendmentsArray,
                                            seqNumber: row.seqNumber,
                                            type: ContentType.LESSON
                                        }, newChapter)

                                    newChapter.addChild(row.seqNumber, newLesson)

                                    this.cache.set(row.ID, newLesson)
                                }
                            })
                        }})
                }
                let finished = this.cache.get(dbResult.ID)
                if (finished) {
                    return finished;
                } else {
                    throw new Error("CACHING FAILED CRITICAL")
                }
            } else {
                throw new ContentNotNavigable();
            }
        } else {
            throw new ContentNotFoundException(where.ID)
        }
    }

    private interpretKeywords(input: keyword[], id: number): ActiveKeyword[] {
        let keywordsArray: ActiveKeyword[] = []
        input.map((keyword) => {
            keywordsArray.push(new ActiveKeyword(keyword.ID, keyword.Score, keyword.word, id))
        })
        return keywordsArray
    }

    private interpretAmendments(input: amendment[]): Amendment[] {
        let amendmentsArray: Amendment[] = []
        input.map((amendment) => {
            amendmentsArray.push(new Amendment(amendment.ID, amendment.CreatorID, amendment.ContentID!, amendment.timestamp))
        })
        return amendmentsArray
    }

    public async fetchContentsWithIDs(idTable: number[]): Promise<Content[]> {
        let result: Content[] = [];

        let databaseFetch: number[] = [];

        idTable.map((id) => {
            let attempt = this.cache.get(id)
            if (attempt) {
                result.push(attempt)
            } else {
                databaseFetch.push(id)
            }
        })

        let dbResults = await prisma.content.findMany({
            where: {
                ID: {in: databaseFetch},
                public: true
            },
            include: {
                amendment: true,
                keyword: true,

                chapter: true,
                course: true,
                lesson: true,
            }
        })

        await dbResults.map(async (value) => {
            if (value.public) {
                let keywordsArray: ActiveKeyword[] = []
                value.keyword.map((keyword) => {
                    keywordsArray.push(new ActiveKeyword(keyword.ID, keyword.Score, keyword.word, value!.ID))
                })

                let amendmentsArray: Amendment[] = []
                value.amendment.map((amendment) => {
                    amendmentsArray.push(new Amendment(amendment.ID, amendment.CreatorID, amendment.ContentID!, amendment.timestamp))
                })

                let type: ContentType;

                let specificID : number;

                if (value.lesson.length > 0) {
                    type = ContentType.LESSON
                    specificID = value.lesson[0].LessonID
                } else if (value.course.length > 0) {
                    type = ContentType.COURSE
                    specificID = value.course[0].CourseID
                } else if (value.chapter.length > 0) {
                    type = ContentType.CHAPTER
                    specificID = value.chapter[0].ChapterID
                } else {
                    throw new Error("UNCLASSIFIED CONTENT CRITICAL")
                }

                let content = new Content(
                    value.ID,
                    specificID,
                    {
                        name: value.name,
                        description: value.description,
                        dateCreated: value.dateCreated,
                        dateModified: value.dateModified,
                        downVotes: value.downVotes,
                        upVotes: value.upVotes,
                        views: value.views,
                        seqNumber: value.seqNumber,
                        amendments: amendmentsArray,
                        keywords: keywordsArray,
                        type: type
                    })
                this.cache.set(value.ID, content)

                result.push(content);
            } else {
                throw new ContentNotNavigable();
            }
        })

        return result;
    }

    public async createMetaAmendment(authorID: number, targetID: number, args : {newName?: string, newDescription?: string, addedKeywords?: Keyword[], deletedKeywords?: Keyword[]}) {
        let content = await this.getContentByID(targetID)

        if(!args.newName && !args.newDescription && !args.addedKeywords && !args.deletedKeywords)
        {
            throw NoChanges
        }

        if (args.deletedKeywords) {
            args.deletedKeywords.map((keywordDeleted) => {
                if(keywordDeleted instanceof ActiveKeyword)
                {
                    if ((keywordDeleted as ActiveKeyword).getContentID() !== targetID) {
                        throw new InvalidArgument("Keyword with id=" + keywordDeleted.getID().toString(), "Must be a keyword associated with the parent.")
                    }
                }
                else{
                    throw new InvalidArgument("Keyword with id=" + keywordDeleted.getID().toString(),"Must be a keyword assigned to the content.")
                }

            })
        }

        let amendment = new MetaAmendment(-1, authorID, targetID, {
            newName: args.newName,
            newDescription: args.newDescription,
            addedKeywords: args.addedKeywords,
            deletedKeywords: args.deletedKeywords
        })

        content.addAmendment(amendment)

        let keywordMods: ({
                ID: number,
                KeywordID: number,
                newWord: null,
                score: null,
                delete: boolean
            }
            |
            {

                ID: number,
                newWord: string | null,
                score: number | null,
                delete: boolean,
                KeywordID: number
            })[] = [];

        let changeID: number = 0

        let keywordsToProvideID: Map<string, Keyword> = new Map<string, Keyword>();

        if (args.addedKeywords) {
            args.addedKeywords.map((keywordAdded) => {
                keywordsToProvideID.set(keywordAdded.getWord(), keywordAdded)

                keywordMods.push({
                    ID: changeID,
                    newWord: keywordAdded.getWord(),
                    score: keywordAdded.getScore(),
                    delete: false,
                    KeywordID: keywordAdded.getID()
                })
                changeID += 1;
            })
        }

        if (args.deletedKeywords) {
            args.deletedKeywords.map((keywordDeleted) => {
                keywordMods.push({
                    ID: changeID,
                    KeywordID: keywordDeleted.getID(),
                    newWord: null,
                    score: null,
                    delete: true,
                })
                changeID += 1;
            })
        }

        let parent = await prisma.amendment.create({
            data: {
                CreatorID: authorID,
                timestamp: amendment.getCreationDate(),
                ContentID: targetID,
                significance: amendment.getSignificance(),
                applied: false,
                keywordmodamendment: {
                    create: {
                        metaamendment: {
                            create: {
                                newName: args.newName,
                                newDescription: args.newDescription
                            }
                        },
                        keywordentrymod: {
                            create: keywordMods
                        }
                    }
                }
            },
            include: {
                keywordmodamendment: {
                    include: {
                        keywordentrymod: {
                            include: {
                                keyword: {
                                    select: {
                                        ID: true,
                                        word: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (parent && parent.keywordmodamendment) {
            parent.keywordmodamendment.keywordentrymod.map((entry) => {
                if (entry.keyword) {
                    let keyword = keywordsToProvideID.get(entry.keyword.word)
                    if (keyword) {
                        keyword.setID(entry.keyword.ID)
                    }
                }
            })
        }

        amendment.setID(parent.ID)

        content.applyMetaAmendment(amendment);
    }

    public async createCreationAmendment(authorID: number, name: string, description: string, keywords: Keyword[], seqNumber: number, type: ContentType, parentID?: number) {
        if(type !== ContentType.COURSE && !parentID)
        {
            throw OrphanedContent
        }
        else if (type === ContentType.COURSE && parentID)
        {
            throw CourseHasNoParent
        }
        else if (parentID) {
            let parent = await this.getSpecificByID(parentID)
            switch (parent.getType()){
                case ContentType.CHAPTER:
                    if(type !== ContentType.LESSON)
                    {
                        throw new WrongParent(type.toString(), "chapter");
                    }
                    break;
                case ContentType.COURSE:
                    if(type !== ContentType.CHAPTER)
                    {
                        throw new WrongParent(type.toString(), "course");
                    }
                    break;
                case ContentType.LESSON:
                    throw new LessonCannotBeParent()
                    break;
            }
            if(parent.checkSeqNumberVacant(seqNumber)!){
                throw SequenceNumberTaken;
            }
        }

        let amendment = new CreationAmendment(-1, {
            authorID: authorID,
            targetID: -1,
            name: name,
            description: description,
            keywords: keywords,
            seqNumber: seqNumber,
            type: type,
            parentID: parentID
        })

        let keywordMods:
            {
                ID: number,
                newWord: string | null,
                score: number | null,
                delete: boolean,
                KeywordID: number
            }[] = [];

        let changeID: number = 0

        let keywordsToProvideID: Map<string, Keyword> = new Map<string, Keyword>();

        keywords.map((keywordAdded) => {
            keywordsToProvideID.set(keywordAdded.getWord(), keywordAdded)

            keywordMods.push({
                ID: changeID,
                newWord: keywordAdded.getWord(),
                score: keywordAdded.getScore(),
                delete: false,
                KeywordID: keywordAdded.getID()
            })
            changeID += 1;
        })

        let typeString: string;

        switch (type) {
            case ContentType.LESSON:
                typeString = "LESSON"
                break;
            case ContentType.COURSE:
                typeString = "COURSE"
                break;
            case ContentType.CHAPTER:
                typeString = "CHAPTER"
                break;
        }

        let parent = await prisma.amendment.create({
            data: {
                CreatorID: authorID,
                timestamp: amendment.getCreationDate(),
                ContentID: null,
                significance: amendment.getSignificance(),
                applied: false,
                keywordmodamendment: {
                    create: {
                        creationamendment: {
                            create: {
                                newName: name,
                                newDescription: description,
                                seqNumber: seqNumber,
                                type: typeString,
                                newParent: parentID
                            }
                        },
                        keywordentrymod: {
                            create: keywordMods
                        }
                    }
                }
            },
            include: {
                keywordmodamendment: {
                    include: {
                        keywordentrymod: {
                            include: {
                                keyword: {
                                    select: {
                                        ID: true,
                                        word: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (parent && parent.keywordmodamendment) {
            parent.keywordmodamendment.keywordentrymod.map((entry) => {
                if (entry.keyword) {
                    let keyword = keywordsToProvideID.get(entry.keyword.word)
                    if (keyword) {
                        keyword.setID(entry.keyword.ID)
                    }
                }
            })
        }

        amendment.setID(parent.ID)

        this.applyContentCreation(amendment);
    }

    public async createAdoptionAmendment(authorID: number, targetID: number, newParent: number) {
        let content = await this.getSpecificByID(targetID)
        let newParentalContent = await this.getSpecificByID(newParent)

        switch (content.getType())
        {
            case ContentType.LESSON:
                if(newParentalContent.getType() !== ContentType.CHAPTER)
                {
                    throw new WrongParent("Lesson",newParentalContent.getType().toString())
                }
                break
            case ContentType.CHAPTER:
                if(newParentalContent.getType() !== ContentType.COURSE)
                {
                    throw new WrongParent("Chapter",newParentalContent.getType().toString())
                }
                break
            case ContentType.COURSE:
                throw new CourseHasNoParent();
        }

        let amendment = new AdoptionAmendment(-1, authorID, targetID, newParent)

        content.addAmendment(amendment)

        if (content.getType() === ContentType.COURSE) {
            throw new CourseHasNoParent();
        }

        let parent = await prisma.amendment.create({
            data: {
                CreatorID: authorID,
                timestamp: amendment.getCreationDate(),
                ContentID: targetID,
                significance: amendment.getSignificance(),
                applied: false,
                adoptionamendment: {
                    create: {
                        newParent: newParent
                    }
                }
            }
        })

        amendment.setID(parent.ID)

        await content.getAdopted(amendment)
    }

    public async createListAmendment(authorID: number, targetID: number, changes: { ChildID: number, newSeqNumber?: number, delete: boolean }[]) {
        let content = await this.getSpecificByID(targetID)

        if(content.getType() === ContentType.LESSON)
        {
            throw new UnsupportedOperation("Lesson","createListAmendment")
        }

        if(!content.checkPaternity(changes)){
            throw new WrongParent("provided child",targetID.toString())
        }

        let amendment = new ListAmendment(-1, authorID, targetID, changes)

        content.addAmendment(amendment)

        let parent = await prisma.amendment.create({
            data: {
                CreatorID: authorID,
                timestamp: amendment.getCreationDate(),
                ContentID: targetID,
                significance: amendment.getSignificance(),
                applied: false,
                listamendments: {
                    create: {
                        contentlistmod : {
                            create : changes
                        }
                    }
                }
            }
        })

        amendment.setID(parent.ID)

        await content.applyListAmendment(amendment);
    }

    public async createPartInsertAmendment(authorID: number, targetID: number, seqNumber : number, arg : { moveExisting : true, oldID : number } | { moveExisting : false,newArgs : lessonPartArgs }) {

        let content = await this.getSpecificByID(targetID)

        if(content.getType() !== ContentType.LESSON)
        {
            throw new InvalidArgument("target with id="+targetID.toString(),"Must be a lesson.")
        }

        let newLessonPartID : number;

        if(arg.moveExisting)
        {
            newLessonPartID = arg.oldID
        }
        else {
            newLessonPartID = await LessonPartManager.getInstance().push(seqNumber, arg.newArgs);
        }

        let amendment = new PartInsertAmendment(-1, authorID, targetID, newLessonPartID, seqNumber, arg.moveExisting)

        let parent = await prisma.amendment.create({
            data : {
                CreatorID : authorID,
                timestamp : amendment.getCreationDate(),
                ContentID : targetID,
                significance: amendment.getSignificance(),
                applied: false,
                partamendment: {
                    create : {
                        LessonPartID : newLessonPartID,
                        partinsertamendment : {
                            create : {
                                seqNumber : seqNumber,
                                moveExisting : arg.moveExisting
                            }
                        }
                    }
                }
            }
        })

        amendment.setID(parent.ID)

        await content.applyPartInsertAmendment(amendment);
    }

    public async createPartModificationAmendment(authorID: number, targetID: number, oldPartID : number, lessonPartArgs : lessonPartArgs) {

        let content = (await this.getContentByID(targetID) as Lesson)

        let seqNumber = content.getLessonPartByID(oldPartID).getSeqNumber();

        if(content.getType() !== ContentType.LESSON)
        {
            throw new InvalidArgument("target with id="+targetID.toString(),"Must be a lesson.")
        }

        let newLessonPartID = await LessonPartManager.getInstance().push(seqNumber, lessonPartArgs);

        let amendment = new PartModificationAmendment(-1, authorID, targetID, oldPartID, newLessonPartID)

        let parent = await prisma.amendment.create({
            data : {
                CreatorID : authorID,
                timestamp : amendment.getCreationDate(),
                ContentID : targetID,
                significance: amendment.getSignificance(),
                applied: false,
                partamendment: {
                    create : {
                        LessonPartID : oldPartID,
                        partmodificationamendment : {
                            create : {
                                NewPartID: newLessonPartID
                            }
                        }
                    }
                }
            }
        })

        amendment.setID(parent.ID)

        await content.applyPartModificationAmendment(amendment);
    }

    public async createPartDeletionAmendment(authorID: number, targetID: number, deletionID : number) {

        let content = await this.getContentByID(targetID)

        if(content.getType() !== ContentType.LESSON)
        {
            throw new InvalidArgument("target with id="+targetID.toString(),"Must be a lesson.")
        }

        let amendment = new PartDeletionAmendment(-1, authorID, targetID, deletionID)

        let parent = await prisma.amendment.create({
            data : {
                CreatorID : authorID,
                timestamp : amendment.getCreationDate(),
                ContentID : targetID,
                significance: amendment.getSignificance(),
                applied: false,
                partamendment: {
                    create : {
                        LessonPartID : deletionID,
                        partdeletionamendment : {
                            create : {}
                        }
                    }
                }
            }
        })

        amendment.setID(parent.ID)

        content.applyPartDeletionAmendment(amendment);
    }

    public async applyContentCreation(amendment: CreationAmendment) {

        let finalID : number | undefined = undefined;

        if(amendment.parentID)
        {
            let content = await this.getSpecificByID(amendment.parentID)

            finalID = content.getSpecificID();

            if(content.checkSeqNumberVacant(amendment.seqNumber)!){
                throw SequenceNumberTaken;
            }
        }

        let newContent: { ID: number } & any;

        switch (amendment.type) {
            case ContentType.CHAPTER:
                newContent = await prisma.content.create({
                    data: {
                        name: amendment.name,
                        description: amendment.description,
                        views: 0,
                        upVotes: 0,
                        downVotes: 0,
                        dateModified: new Date(),
                        dateCreated: amendment.getCreationDate(),
                        seqNumber: amendment.seqNumber,
                        public: true,

                        chapter: {
                            create: {
                                CourseID: finalID!
                            }
                        }
                    }
                })
                break;
            case ContentType.COURSE:
                newContent = await prisma.content.create({
                    data: {
                        name: amendment.name,
                        description: amendment.description,
                        views: 0,
                        upVotes: 0,
                        downVotes: 0,
                        dateModified: new Date(),
                        dateCreated: amendment.getCreationDate(),
                        seqNumber: amendment.seqNumber,
                        public: true,

                        course: {
                            create: {}
                        }
                    }
                })
                break;
            case ContentType.LESSON:
                newContent = await prisma.content.create({
                    data: {
                        name: amendment.name,
                        description: amendment.description,
                        views: 0,
                        upVotes: 0,
                        downVotes: 0,
                        dateModified: new Date(),
                        dateCreated: amendment.getCreationDate(),
                        seqNumber: amendment.seqNumber,
                        public: true,

                        lesson: {
                            create: {
                                ChapterID: finalID!
                            }
                        }
                    }
                })
                break;
        }

        await prisma.amendment.update({
            where: {
                ID: amendment.getID()
            },
            data: {
                ContentID: newContent.ID,
                applied: true
            }
        })

        let keywordManager = await KeywordManager.getInstance()

        let idsToUpdate: number[] = [];

        amendment.keywords.map((keyword) => {
            idsToUpdate.push(keyword.getID())
            keywordManager.activate(keyword, newContent.ID)
        })

        await prisma.keyword.updateMany({
            where: {
                ID: {
                    in: idsToUpdate
                }
            },
            data: {
                ContentID: newContent.ID
            }
        })

        await this.getSpecificByID(newContent.ID)
    }
}

export default ContentManager;