import prisma from "../../../../prisma/prisma";
import Keyword, {ActiveKeyword} from "./Keyword";
import Content, {MetaOutput} from "../Content";
import ContentManager from "../ContentManager";
import {NOTFOUND} from "dns";
import {NotFoundException} from "../../tools/Errors";

class KeywordManager {
    private static instance: KeywordManager | null = null;

    private activeKeywords: Map<string, ActiveKeyword[]>;

    private allKeywords: Map<number, Keyword>;

    private constructor(keywordsInput: { ID: number, ContentID: number | null; word: string; Score: number; }[]) {
        this.activeKeywords = new Map<string, ActiveKeyword[]>();
        this.allKeywords = new Map<number, Keyword>();

        keywordsInput.map((value) => {
            if (value.ContentID) {
                let activeKeyword = new ActiveKeyword(value.ID ,value.Score, value.word, value.ContentID)

                let currentMap = this.activeKeywords.get(value.word)
                if (currentMap) {
                    currentMap.push(activeKeyword)
                } else {
                    this.activeKeywords.set(value.word, [activeKeyword])
                }
                this.allKeywords.set(value.ID, activeKeyword)
            } else {
                this.allKeywords.set(value.ID, new Keyword(value.ID, value.Score, value.word))
            }
        })
    }

    public static async getInstance() {
        if (!this.instance) {
            let keywordsInput = await this.fetchKeywords();
            this.instance = new KeywordManager(keywordsInput);
        }
        return this.instance;
    }

    private appendActive(keyword : ActiveKeyword)
    {
        let currentTable = this.activeKeywords.get(keyword.getWord())

        if(currentTable)
        {
            currentTable.push(keyword)
        }
        else{
            this.activeKeywords.set(keyword.getWord(), [keyword])
        }
    }

    private removeActive(keyword : ActiveKeyword)
    {
        let currentTable = this.activeKeywords.get(keyword.getWord())

        if(currentTable)
        {
            currentTable.filter((thisKeyword) => {
                if(keyword === thisKeyword){
                    return false
                }
                return true
            })
        }
    }

    private static async fetchKeywords() {
        return prisma.keyword.findMany({
            select: {
                ID: true,
                ContentID: true,
                word: true,
                Score: true,
            }
        });
    }

    public async resolveSearch(query: String): Promise<{score : number, content : MetaOutput}[]> {
        let words = query.split(" ");

        let contentIDs = new Map<number, number>;

        words.map((word) => {
            let contents = this.activeKeywords.get(word)

            if (contents) {
                contents.map((activeKeyword) => {
                    let current = contentIDs.get(activeKeyword.getContentID())
                    if (current) {
                        contentIDs.set(activeKeyword.getContentID(), current + activeKeyword.getScore())
                    } else {
                        contentIDs.set(activeKeyword.getContentID(), activeKeyword.getScore())
                    }
                })
            }
        })

        let fetchedContents = await ContentManager.getInstance().fetchContentsWithIDs(Array.from(contentIDs.keys()));

        let resultingMap : {score : number, content : MetaOutput}[] = [];

        for(let fetchedContent of fetchedContents) {
            let score = contentIDs.get(fetchedContent.getID())
            if (score) {
                let overall = score * fetchedContent.getSignificance();
                resultingMap.push({score: overall, content: await fetchedContent.getMeta()});
            }
        }

        return resultingMap
    }

    public activate(keyword : Keyword, contentID : number)
    {
        let x = new ActiveKeyword(keyword.getID(), keyword.getScore(), keyword.getWord(), contentID)
        this.allKeywords.set(keyword.getID(), x)
        this.appendActive(x)

        return x
    }

    public deactivate(keyword : ActiveKeyword)
    {
        this.removeActive(keyword)

        let x = new Keyword(keyword.getID(), keyword.getScore(), keyword.getWord())
        prisma.keyword.update({
            where : {
                ID : keyword.getID()
            },
            data : {
                ContentID: null
            }
        })

        this.allKeywords.set(keyword.getID(), x)

        return x
    }

    public async createKeywords(input : { word : string, Score : number }[]) : Promise<Keyword[]> {

        let result : Keyword[] = [];

        await Promise.all(input.map(async (row) => {
            let newKeyword = new Keyword(-1,row.Score,row.word);
            let dbOutput = await prisma.keyword.create({
                data: row
            })
            newKeyword.setID(dbOutput.ID)
            result.push(newKeyword)
            this.allKeywords.set(dbOutput.ID,newKeyword);
        }))

        return result;

    }

    public getKeywordByID(id : number) {
        let output = this.allKeywords.get(id)

        if(output)
        {
            return output
        }
        throw new NotFoundException("Keyword",id)
    }
}

export default KeywordManager;