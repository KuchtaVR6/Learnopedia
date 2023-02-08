import Amendment, {AmendmentOpinionValues} from "./Amendment";
import SelfPurgingMap from "../tools/SelfPurgingMap";
import prisma from "../../../prisma/prisma";
import {
    adoptionamendment,
    amendment,
    contentlistmod,
    creationamendment,
    keyword,
    keywordentrymod,
    keywordmodamendment,
    listamendment,
    metaamendment,
    partaddreplaceamendment,
    partamendment,
    amendmentopinion
} from "@prisma/client";
import {LegacyAmendment, NotFoundException} from "../tools/Errors";
import CreationAmendment from "./CreationAmendment";
import KeywordManager from "../contents/keywords/KeywordManager";
import {ContentType} from "../contents/Content";
import Keyword from "../contents/keywords/Keyword";
import MetaAmendment from "./MetaAmendment";
import AdoptionAmendment from "./AdoptionAmendment";
import ListAmendment from "./ListAmendment";
import PartAddReplaceAmendment from "./PartAmendments/PartAddReplaceAmendment";

export const prismaInclusions = {
    adoptionamendment: true,
    keywordmodamendment: {
        include: {
            keywordentrymod: {
                include: {
                    keyword: true
                }
            },
            creationamendment: true,
            metaamendment: true
        }
    },
    listamendment: {
        include : {
            contentlistmod : true
        }
    },
    partamendment: {
        include: {
            partaddreplaceamendment: true
        }
    },
    amendmentopinion: true
}

export type fullAmendFetchType = (amendment & {
    adoptionamendment: adoptionamendment | null;
    keywordmodamendment: (keywordmodamendment & {
        creationamendment: creationamendment | null;
        keywordentrymod: (keywordentrymod & {
            keyword: keyword | null;
        })[];
        metaamendment: metaamendment | null;
    }) | null;
    listamendment: (listamendment & {
        contentlistmod : contentlistmod[]
    }) | null;
    partamendment: (partamendment & {
        partaddreplaceamendment: partaddreplaceamendment | null;
    }) | null;
    amendmentopinion: amendmentopinion[] | null;
})

class AmendmentManager {
    private static instance: AmendmentManager | null = null;

    private cache: SelfPurgingMap<number, Amendment>;

    private constructor() {
        this.cache = new SelfPurgingMap<number, Amendment>();
    }

    public static getInstance(): AmendmentManager {
        if (!this.instance) {
            this.instance = new AmendmentManager()
        }
        return this.instance;
    }

    public async retrieve(id: number): Promise<Amendment> {
        let search = this.cache.get(id)
        if (search) {
            return search
        }

        let dbResult = await prisma.amendment.findFirst({
            where: {
                AND: [{ID: id}, {NOT: {ContentID: null}}]
            }
        })

        if (dbResult) {
            return (await this.insertToCachePartial(dbResult))
        } else {
            throw new NotFoundException("Amendment", id)
        }
    }

    public async retrieveSpecific(id: number) {
        let search = this.cache.get(id)
        if (search) {
            if (search.fullyFetched()) {
                return search
            }
        }

        let dbResult = await prisma.amendment.findFirst({
            where: {
                AND: [{ID: id}, {NOT: {ContentID: null}}]
            },
            include: prismaInclusions
        })

        if (dbResult) {
            return (await this.insertToCache(dbResult))
        } else {
            throw new NotFoundException("Amendment", id)
        }
    }

    public async push(amendment: Amendment) {
        this.cache.set(amendment.getID(), amendment);
    }

    private static stringToContentType(input: string): ContentType {
        if (input === "LESSON") {
            return ContentType.LESSON
        } else if (input === "CHAPTER") {
            return ContentType.CHAPTER
        } else if (input === "COURSE") {
            return ContentType.COURSE
        } else {
            throw new Error("UNCLASSIFIED TAG CRITICAL")
        }
    }

    private handleOpinions(input : amendmentopinion[]) : Map<number, AmendmentOpinionValues> {
        let map = new Map<number, AmendmentOpinionValues>()
        input.map((row) => {
            let val;
            if(row.positive)
            {
                val = AmendmentOpinionValues.Positive
            }
            else if(row.negative)
            {
                val = AmendmentOpinionValues.Negative
            }
            else
            {
                val = AmendmentOpinionValues.Report
            }
            map.set(row.userID, val)
        })
        return map
    }

    public async insertToCache(input: fullAmendFetchType): Promise<Amendment> {
        if (input.ContentID || input.keywordmodamendment?.creationamendment) {
            let result: Amendment | null = null;
            if (input.keywordmodamendment) {
                let keywordMan = await KeywordManager.getInstance();
                if (input.keywordmodamendment.creationamendment) {
                    let x: Keyword[] = keywordMan.interpretKeywordAdditions(input.keywordmodamendment.keywordentrymod)

                    result = new CreationAmendment(
                        input.ID,
                        {
                            authorID: input.CreatorID,
                            targetID: input.ContentID || -1,
                            name: input.keywordmodamendment.creationamendment.newName,
                            description: input.keywordmodamendment.creationamendment.newDescription,
                            keywords: x,
                            seqNumber: input.keywordmodamendment.creationamendment.seqNumber,
                            type: AmendmentManager.stringToContentType(input.keywordmodamendment.creationamendment.type),
                            parentID: input.keywordmodamendment.creationamendment.newParent ? input.keywordmodamendment.creationamendment.newParent : undefined
                        },
                        {
                            dbInput: true,
                            creationDate: input.timestamp,
                            significance: input.significance,
                            tariff: input.tariff,
                            applied: input.applied,
                            vetoed: input.vetoed,
                            opinions: (input.amendmentopinion)? this.handleOpinions(input.amendmentopinion) : undefined
                        })
                } else if (input.keywordmodamendment.metaamendment) {
                    let add: Keyword[] = keywordMan.interpretKeywordAdditions(input.keywordmodamendment.keywordentrymod)
                    let del: Keyword[] = keywordMan.interpretKeywordDeletions(input.keywordmodamendment.keywordentrymod)

                    result = new MetaAmendment(
                        input.ID,
                        input.CreatorID,
                        input.ContentID!,
                        {
                            newName: input.keywordmodamendment.metaamendment.newName? input.keywordmodamendment.metaamendment.newName : undefined,
                            newDescription: input.keywordmodamendment.metaamendment.newDescription? input.keywordmodamendment.metaamendment.newDescription : undefined,
                            addedKeywords: add.length<1? undefined : add,
                            deletedKeywords: del.length<1? undefined : del,
                        },
                        {
                            dbInput: true,
                            creationDate: input.timestamp,
                            significance: input.significance,
                            tariff: input.tariff,
                            applied: input.applied,
                            vetoed: input.vetoed,
                            opinions: (input.amendmentopinion)? this.handleOpinions(input.amendmentopinion) : undefined
                        })
                }
            }
            else if(input.adoptionamendment)
            {
                let myResult = new AdoptionAmendment(
                    input.ID,
                    input.CreatorID,
                    input.ContentID!,
                    input.adoptionamendment.newParent? input.adoptionamendment.newParent : -1,
                    {
                        dbInput: true,
                        creationDate: input.timestamp,
                        significance: input.significance,
                        tariff: input.tariff,
                        applied: input.applied,
                        vetoed: input.vetoed,
                        opinions: (input.amendmentopinion)? this.handleOpinions(input.amendmentopinion) : undefined
                    })

                result = myResult;
            }
            else if(input.listamendment)
            {
                let changes :
                    {
                        ChildID?: number | undefined,
                        LessonPartID?: number | undefined,
                        newSeqNumber?: number | undefined,
                        delete?: boolean | undefined
                    }[] = []

                input.listamendment.contentlistmod.map((change) => {
                    changes.push({
                        ChildID: change.ChildID? change.ChildID : undefined,
                        LessonPartID: change.LessonPartID? change.LessonPartID : undefined,
                        newSeqNumber: change.newSeqNumber? change.newSeqNumber : undefined,
                        delete: change.delete? change.delete : undefined
                    })
                })

                result = new ListAmendment(
                    input.ID,
                    input.CreatorID,
                    input.ContentID!,
                    changes,
                    {
                        dbInput: true,
                        creationDate: input.timestamp,
                        significance: input.significance,
                        tariff: input.tariff,
                        applied: input.applied,
                        vetoed: input.vetoed,
                        opinions: (input.amendmentopinion)? this.handleOpinions(input.amendmentopinion) : undefined
                    }
                )
            }
            else if(input.partamendment)
            {
                if(input.partamendment.partaddreplaceamendment) {
                    result = new PartAddReplaceAmendment(
                        input.ID,
                        input.CreatorID,
                        input.ContentID!,
                        input.partamendment.LessonPartID? input.partamendment.LessonPartID : undefined,
                        input.partamendment.partaddreplaceamendment.seqNumber,
                        {
                            dbInput: true,
                            creationDate: input.timestamp,
                            significance: input.significance,
                            tariff: input.tariff,
                            applied: input.applied,
                            vetoed: input.vetoed,
                            opinions: (input.amendmentopinion)? this.handleOpinions(input.amendmentopinion) : undefined
                        },
                        input.partamendment.partaddreplaceamendment.OldPartID ? input.partamendment.partaddreplaceamendment.OldPartID : undefined,
                    )
                }
            }

            if (result !== undefined && result !== null) {
                this.cache.set(result.getID(), result)
                return result;
            }
            else{
                throw new Error("UNCLASSIFIED AMENDMENT CRITICAL")
            }
        } else {
            throw new LegacyAmendment();
        }
    }

    public async insertManyToCache(input: fullAmendFetchType[]): Promise<Amendment[]> {
        let result: Amendment[] = []

        for (let amend of input) {
            result.push(await this.insertToCache(amend))
        }

        return result;
    }

    public insertToCachePartial(input: amendment): Amendment {
        if (input.ContentID) {
            let result = new Amendment(input.ID, input.CreatorID, input.ContentID, input.significance, input.tariff, input.vetoed, input.timestamp, input.applied)
            this.cache.set(input.ID, result)
            return result
        } else {
            throw new LegacyAmendment();
        }
    }

    public insertManyToCachePartial(input: amendment[]): Amendment[] {
        let result: Amendment[] = []

        for (let amend of input) {
            result.push(this.insertToCachePartial(amend))
        }

        return result;
    }
}

export default AmendmentManager;