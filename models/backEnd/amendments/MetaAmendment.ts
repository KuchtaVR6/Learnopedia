import Amendment from "./Amendment";
import {EmptyModification} from "../tools/Errors";
import Keyword from "../contents/keywords/Keyword";

class MetaAmendment extends Amendment{
    public readonly newName : string | undefined;
    public readonly newDescription : string | undefined;
    public readonly addedKeywords : Keyword[] | undefined;
    public readonly deletedKeywords : Keyword[] | undefined;

    public constructor(
        id : number,
        authorID : number,
        targetID : number,
        args : {newName? : string, newDescription? : string, addedKeywords? : Keyword[], deletedKeywords? : Keyword[]},
        creationDate? : Date
    ) {
        if(!args.newName && !args.newDescription && !args.addedKeywords && !args.deletedKeywords)
        {
            throw new EmptyModification();
        }

        if(creationDate) {
            super(id, authorID, targetID, creationDate);
        }
        else{
            super(id, authorID, targetID)
        }

        this.newName = args.newName;
        this.newDescription = args.newDescription;
        this.addedKeywords = args.addedKeywords;
        this.deletedKeywords = args.deletedKeywords;
    }
}

export default MetaAmendment;