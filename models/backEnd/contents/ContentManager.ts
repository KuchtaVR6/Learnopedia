import SelfPurgingMap from "../tools/SelfPurgingMap";
import Content, {ContentType, MetaOutput} from "./Content";
import {
    ContentNotFoundException,
    ContentNotNavigable,
    CourseHasNoParent,
    InvalidArgument,
    LessonCannotBeParent,
    NoChanges,
    OrphanedContent,
    SequenceNumberTaken,
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
import {keyword} from "@prisma/client";
import {Course} from "./Course";
import Chapter from "./Chapter";
import Lesson from "./Lesson";
import LessonPartManager, {lessonPartArgs} from "../lessonParts/LessonPartManager";
import PartAddReplaceAmendment from "../amendments/PartAmendments/PartAddReplaceAmendment";
import {UserManager} from "../managers/UserManager";
import AmendmentManager, {prismaInclusions} from "../amendments/AmendmentManager";

class ContentManager {
    private static instance: ContentManager | null = null;

    private cache: SelfPurgingMap<number, Content>

    private recommended: Content[];
    private staleTime : number;

    private constructor() {
        this.cache = new SelfPurgingMap<number, Content>();
        this.recommended = [];
        this.staleTime = 0;
    }

    public async getRecommendations() {
        if(this.staleTime<(new Date()).getTime())
        {
            //create recommendations
            let dbResults = await prisma.content.findMany({
                where : {
                    public : true
                },
                orderBy : {
                    views : "desc"
                },
                take : 20,
                include : {
                    keyword : true,
                    amendment : true,

                    lesson : true,
                    course : true,
                    chapter : true,

                    contentopinion : true
                }
            })

            this.recommended = [];

            for(let value of dbResults) {
                if (value.public) {
                    let keywordsArray: ActiveKeyword[] = []
                    value.keyword.map((keyword) => {
                        keywordsArray.push(new ActiveKeyword(keyword.ID, keyword.Score, keyword.word, value!.ID))
                    })

                    let amendmentsArray: Amendment[] = []
                    value.amendment.map((amendment) => {
                        amendmentsArray.push(new Amendment(amendment.ID, amendment.CreatorID, amendment.ContentID!, amendment.significance, amendment.tariff, amendment.vetoed,amendment.timestamp))
                    })
                    let upVotes = 0;
                    let downVotes = 0;
                    value.contentopinion.map((opinion) => {
                        if(opinion.positive)
                            upVotes += 1;
                        else
                            downVotes += 1;
                    })

                    let type: ContentType;

                    let specificID : number;

                    if (value.lesson) {
                        type = ContentType.LESSON
                        specificID = value.lesson.LessonID
                    } else if (value.course) {
                        type = ContentType.COURSE
                        specificID = value.course.CourseID
                    } else if (value.chapter) {
                        type = ContentType.CHAPTER
                        specificID = value.chapter.ChapterID
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
                            downVotes: downVotes,
                            upVotes: upVotes,
                            views: value.views,
                            seqNumber: value.seqNumber,
                            amendments: amendmentsArray,
                            keywords: keywordsArray,
                            type: type,
                            numberAuthors : value.numberOfAuthors
                        })
                    this.cache.set(value.ID, content)

                    this.recommended.push(content);
                } else {
                    throw new ContentNotNavigable();
                }

                this.staleTime = (new Date()).getTime() + 60*60*1000
            }
        }
        return this.recommended;
    }

    public async getRecommendedMetas() : Promise<MetaOutput[]>
    {
        let x = (await this.getRecommendations())

        let result : MetaOutput[] = [];

        for(let recommendation of x)
        {
            result.push(await recommendation.getMeta())
        }

        return result;
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
                course: true,

                contentopinion: true
            }
        })
        if (dbResult) {
            if (dbResult.public) {
                let keywordsArray: ActiveKeyword[] = []
                dbResult.keyword.map((keyword) => {
                    keywordsArray.push(new ActiveKeyword(keyword.ID, keyword.Score, keyword.word, dbResult!.ID))
                })

                let amendmentsArray: Amendment[] = AmendmentManager.getInstance().insertManyToCachePartial(dbResult.amendment);

                let upVotes = 0;
                let downVotes = 0;
                dbResult.contentopinion.map((opinion) => {
                    if(opinion.positive)
                        upVotes += 1;
                    else
                        downVotes += 1;
                })

                let type: ContentType;
                let specificID : number;

                if (dbResult.lesson) {
                    type = ContentType.LESSON
                    specificID = dbResult.lesson.LessonID
                } else if (dbResult.course) {
                    type = ContentType.COURSE
                    specificID = dbResult.course.CourseID
                } else if (dbResult.chapter) {
                    type = ContentType.CHAPTER
                    specificID = dbResult.chapter.ChapterID
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
                        downVotes: downVotes,
                        upVotes: upVotes,
                        views: dbResult.views,
                        seqNumber: dbResult.seqNumber,
                        amendments: amendmentsArray,
                        keywords: keywordsArray,
                        type: type,
                        numberAuthors : dbResult.numberOfAuthors
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

                if (dbResult.course) {
                    targetHost = dbResult.course.ContentID
                } else if (dbResult.chapter) {
                    targetHost = dbResult.chapter.course.ContentID
                } else if (dbResult.lesson) {
                    targetHost = dbResult.lesson.chapter.course.ContentID
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
                        amendment: {
                            include : prismaInclusions
                        },
                        contentopinion : true,

                        course: {
                            include: {
                                chapter: {
                                    include: {
                                        content: {
                                            include: {
                                                keyword: true,
                                                amendment: {
                                                    include : prismaInclusions
                                                },
                                                contentopinion : true
                                            }
                                        },
                                        lesson: {
                                            include: {
                                                content: {
                                                    include: {
                                                        contentopinion : true,
                                                        keyword: true,
                                                        amendment: {
                                                            include : prismaInclusions
                                                        }
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

                if (dbFull && dbFull.public && dbFull.course) {
                    //caching the course
                    let KeywordsArray = this.interpretKeywords(dbFull.keyword, dbFull.ID);
                    let AmendmentsArray = await AmendmentManager.getInstance().insertManyToCache(dbFull.amendment);

                    let upVotes = 0;
                    let downVotes = 0;
                    dbFull.contentopinion.map((opinion) => {
                        if(opinion.positive)
                            upVotes += 1;
                        else
                            downVotes += 1;
                    })

                    let host = new Course(dbFull.ID, dbFull.course.CourseID, {
                        name: dbFull.name,
                        description: dbFull.description,
                        keywords: KeywordsArray,
                        views: dbFull.views,
                        upVotes: upVotes,
                        downVotes: downVotes,
                        dateModified: dbFull.dateModified,
                        dateCreated: dbFull.dateCreated,
                        amendments: AmendmentsArray,
                        seqNumber: dbFull.seqNumber,
                        type: ContentType.COURSE,
                        numberAuthors : dbFull.numberOfAuthors
                    })

                    this.cache.set(dbFull.ID, host)

                    for(let chapter of dbFull.course.chapter) {
                        if(chapter.content.public) {
                            let row = chapter.content

                            let KeywordsArray = this.interpretKeywords(row.keyword, row.ID);
                            let AmendmentsArray = await AmendmentManager.getInstance().insertManyToCache(row.amendment);
                            let upVotes = 0;
                            let downVotes = 0;
                            row.contentopinion.map((opinion) => {
                                if(opinion.positive)
                                    upVotes += 1;
                                else
                                    downVotes += 1;
                            })

                            let newChapter = new Chapter(row.ID, chapter.ChapterID,
                                {
                                    name: row.name,
                                    description: row.description,
                                    keywords: KeywordsArray,
                                    views: row.views,
                                    upVotes: upVotes,
                                    downVotes: downVotes,
                                    dateModified: row.dateModified,
                                    dateCreated: row.dateCreated,
                                    amendments: AmendmentsArray,
                                    seqNumber: row.seqNumber,
                                    type: ContentType.CHAPTER,
                                    numberAuthors : row.numberOfAuthors
                                }, host)

                            host.addChild(row.seqNumber, newChapter)

                            this.cache.set(row.ID, newChapter)

                            for(let lesson of chapter.lesson) {
                                let row = lesson.content

                                if(row.public) {

                                    let KeywordsArray = this.interpretKeywords(row.keyword, row.ID);
                                    let AmendmentsArray = await AmendmentManager.getInstance().insertManyToCache(row.amendment);
                                    let upVotes = 0;
                                    let downVotes = 0;
                                    row.contentopinion.map((opinion) => {
                                        if(opinion.positive)
                                            upVotes += 1;
                                        else
                                            downVotes += 1;
                                    })

                                    let newLesson = new Lesson(row.ID, lesson.LessonID,
                                        {
                                            name: row.name,
                                            description: row.description,
                                            keywords: KeywordsArray,
                                            views: row.views,
                                            upVotes: upVotes,
                                            downVotes: downVotes,
                                            dateModified: row.dateModified,
                                            dateCreated: row.dateCreated,
                                            amendments: AmendmentsArray,
                                            seqNumber: row.seqNumber,
                                            type: ContentType.LESSON,
                                            numberAuthors : row.numberOfAuthors
                                        }, newChapter)

                                    newChapter.addChild(row.seqNumber, newLesson)

                                    this.cache.set(row.ID, newLesson)
                                }
                            }
                        }}
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

    public returnDeletedMeta() : MetaOutput{
        return {
            id : -1,
            upVotes: 0,
            type : ContentType.LESSON,
            downVotes: 0,
            seqNumber : 0,
            name : "This content has been deleted... :(",
            keywords: [],
            creation: "unknown",
            modification: "unknown",
            description: "",
            authors: ""
        }
    }

    private interpretKeywords(input: keyword[], id: number): ActiveKeyword[] {
        let keywordsArray: ActiveKeyword[] = []
        input.map((keyword) => {
            keywordsArray.push(new ActiveKeyword(keyword.ID, keyword.Score, keyword.word, id))
        })
        return keywordsArray
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

                contentopinion: true
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
                    amendmentsArray.push(new Amendment(amendment.ID, amendment.CreatorID, amendment.ContentID!, amendment.significance, amendment.tariff, amendment.vetoed,amendment.timestamp))
                })

                let upVotes = 0;
                let downVotes = 0;

                value.contentopinion.map((opinion) => {
                    if(opinion.positive)
                        upVotes += 1;
                    else
                        downVotes += 1;
                })



                let type: ContentType;

                let specificID : number;

                if (value.lesson) {
                    type = ContentType.LESSON
                    specificID = value.lesson.LessonID
                } else if (value.course) {
                    type = ContentType.COURSE
                    specificID = value.course.CourseID
                } else if (value.chapter) {
                    type = ContentType.CHAPTER
                    specificID = value.chapter.ChapterID
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
                        downVotes: downVotes,
                        upVotes: upVotes,
                        views: value.views,
                        seqNumber: value.seqNumber,
                        amendments: amendmentsArray,
                        keywords: keywordsArray,
                        type: type,
                        numberAuthors : value.numberOfAuthors
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
        let author = await UserManager.getInstance().getUserID(authorID);

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
        }, {dbInput : false, targetType : content.getType()})

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
                tariff: amendment.getTariff(),
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
        author.addAmendment(amendment);

        await content.applyMetaAmendment(amendment);
    }

    public async createCreationAmendment(authorID: number, name: string, description: string, keywords: Keyword[], seqNumber: number, type: ContentType, parentID?: number) {
        let author = await UserManager.getInstance().getUserID(authorID);

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
        },{dbInput : false})

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
                tariff: amendment.getTariff(),
                applied: false,
                keywordmodamendment: {
                    create: {
                        creationamendment: {
                            create: {
                                newName: name,
                                newDescription: description,
                                seqNumber: seqNumber,
                                newParent: parentID,
                                type: typeString,
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
        author.addAmendment(amendment);

        await AmendmentManager.getInstance().push(amendment);

        await this.applyContentCreation(amendment);
    }

    public async createAdoptionAmendment(authorID: number, targetID: number, newParent: number) {
        let content = await this.getSpecificByID(targetID)
        let newParentalContent = await this.getSpecificByID(newParent)
        let author = await UserManager.getInstance().getUserID(authorID);

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

        let amendment = new AdoptionAmendment(-1, authorID, targetID, newParent, {dbInput: false, otherSignificance: newParentalContent.getSignificance()})

        content.addAmendment(amendment)

        if (content.getType() === ContentType.COURSE) {
            throw new CourseHasNoParent();
        }

        let secondEntry = await prisma.amendment.create({
            data: {
                CreatorID: authorID,
                timestamp: amendment.getCreationDate(),
                ContentID: targetID,
                significance: amendment.getSignificance(),
                tariff : amendment.getTariff(),
                applied: false,
                adoptionamendment: {
                    create: {
                        newParent: newParent
                    }
                }
            }
        })

        let parent = await prisma.amendment.create({
            data: {
                CreatorID: authorID,
                timestamp: amendment.getCreationDate(),
                ContentID: targetID,
                significance: amendment.getSignificance(),
                tariff : amendment.getTariff(),
                applied: false,
                adoptionamendment: {
                    create: {
                        newParent: newParent,
                        receiverAmendment : secondEntry.ID
                    }
                }
            }
        })

        amendment.setID(parent.ID)

        amendment.setReceivingAmendmentID(secondEntry.ID)
        author.addAmendment(amendment);

        await AmendmentManager.getInstance().push(amendment);

        await content.getAdopted(amendment)
    }

    public async createListAmendment(authorID: number, targetID: number, changes: { ChildID?: number, newSeqNumber?: number, LessonPartID? : number, delete: boolean }[]) {
        let content = await this.getSpecificByID(targetID)
        let author = await UserManager.getInstance().getUserID(authorID);

        if(!content.checkPaternity(changes)){
            throw new WrongParent("provided child",targetID.toString())
        }

        let amendment = new ListAmendment(-1, authorID, targetID, changes, {dbInput: false, targetType: content.getType()})

        content.addAmendment(amendment)

        let parent = await prisma.amendment.create({
            data: {
                CreatorID: authorID,
                timestamp: amendment.getCreationDate(),
                ContentID: targetID,
                significance: amendment.getSignificance(),
                tariff: amendment.getTariff(),
                applied: false,
                listamendment: {
                    create : {
                        contentlistmod : {
                            create : changes
                        }
                    }
                }

            }
        })

        amendment.setID(parent.ID)
        author.addAmendment(amendment);

        await AmendmentManager.getInstance().push(amendment);

        await content.applyListAmendment(amendment);
    }

    public async createAddReplaceAmendment(authorID: number, targetID: number, seqNumber : number, arg : { oldID? : number, newArgs : lessonPartArgs }) {

        let author = await UserManager.getInstance().getUserID(authorID);
        let content = await this.getSpecificByID(targetID)

        if(content.getType() !== ContentType.LESSON)
        {
            throw new InvalidArgument("target with id="+targetID.toString(),"Must be a lesson.")
        }

        let newLessonPartID : number;

        newLessonPartID = await LessonPartManager.getInstance().push(seqNumber, arg.newArgs);

        let amendment = new PartAddReplaceAmendment(-1, authorID, targetID, newLessonPartID, seqNumber, {dbInput: false}, arg.oldID)

        let parent = await prisma.amendment.create({
            data : {
                CreatorID : authorID,
                timestamp : amendment.getCreationDate(),
                ContentID : targetID,
                significance: amendment.getSignificance(),
                tariff: amendment.getTariff(),
                applied: false,
                partamendment: {
                    create : {
                        LessonPartID : newLessonPartID,
                        partaddreplaceamendment : {
                            create : {
                                OldPartID : arg.oldID,
                                seqNumber : seqNumber,
                            }
                        }
                    }
                }
            }
        })

        amendment.setID(parent.ID)
        author.addAmendment(amendment);

        await AmendmentManager.getInstance().push(amendment);

        await content.applyPartAddReplaceAmendment(amendment);
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
                        dateModified: new Date(),
                        dateCreated: amendment.getCreationDate(),
                        seqNumber: amendment.seqNumber,
                        public: true,
                        numberOfAuthors: 1,

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
                        dateModified: new Date(),
                        dateCreated: amendment.getCreationDate(),
                        seqNumber: amendment.seqNumber,
                        public: true,
                        numberOfAuthors: 1,

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
                        dateModified: new Date(),
                        dateCreated: amendment.getCreationDate(),
                        seqNumber: amendment.seqNumber,
                        public: true,
                        numberOfAuthors: 1,

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