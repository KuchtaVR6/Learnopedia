import {NotFoundException, UnsupportedOperation} from "../tools/Errors";
import prisma from "../../../prisma/prisma";
import LessonPart from "./LessonPart";
import Paragraph, {ParagraphOutput} from "./Paragraph";

export type lessonPartArgs = {
    type : lessonPartTypes,
    content : ParagraphOutput
}

export enum lessonPartTypes {
    PARAGRAPH
}

class LessonPartManager {

    private static instance : LessonPartManager | null = null;

    private constructor() {
    }

    public static getInstance() {
        if(!this.instance)
        {
            this.instance = new LessonPartManager()
        }
        return this.instance;
    }

    public async push(seqNumber : number, args : lessonPartArgs) : Promise<number> {
        if(args.type === lessonPartTypes.PARAGRAPH)
        {
            let output = await prisma.lessonparts.create({
                data : {
                    seqNumber : seqNumber,
                    paragraph: {
                        create : {
                            basicText : args.content.basicText,
                            advancedText : args.content.advancedText
                        }
                    }
                }
            })

            return output.LessonPartID
        }
        else{
            throw UnsupportedOperation;
        }
    }

    public async retrieve(id : number) : Promise<LessonPart> {
        let output = await prisma.lessonparts.findUnique({
            where : {
                LessonPartID : id
            },
            include : {
                paragraph: {
                    select : {
                        basicText: true,
                        advancedText: true
                    }
                }
                //todo (when other types added) all others
            }
        })

        if(!output)
        {
            throw new NotFoundException("LessonPart",id)
        }

        if(output.paragraph)
        {
            return new Paragraph(output.LessonPartID,output.seqNumber,output.paragraph.basicText,output.paragraph.advancedText)
        }
        else{
            //todo (when other types added)
            throw UnsupportedOperation;
        }
    }
}

export default LessonPartManager;