import Amendment from "./Amendment";
import Keyword from "../contents/keywords/Keyword";
import {ContentType} from "../contents/Content";
import {ContentNeedsParent} from "../tools/Errors";

class CreationAmendment extends Amendment{
    public readonly name : string;
    public readonly description : string;
    public readonly keywords : Keyword[];
    public readonly seqNumber : number;
    public readonly type : ContentType;
    public readonly parentID : number | undefined;

    public constructor(id : number, args : {authorID : number, targetID : number, name : string, description : string, keywords : Keyword[], seqNumber : number, type : ContentType, parentID? : number}, creationDate? : Date) {
        if(!args.parentID && args.type !== ContentType.COURSE)
        {
            throw new ContentNeedsParent();
        }

        super(id, args.authorID, args.targetID, creationDate);

        this.name = args.name;
        this.description = args.description;
        this.keywords = args.keywords;
        this.seqNumber = args.seqNumber;
        this.type = args.type;

        this.parentID = args.parentID;
    }
}

export default CreationAmendment;