import {UserManager} from "../managers/UserManager";
import prisma from "../../../prisma/prisma";

class Amendment {

    private id : number;
    private readonly creationDate : Date;
    private readonly authorID : number | null;
    protected readonly targetID : number;
    protected readonly significance : number = 0;

    public constructor(id : number, authorID : number | null, targetID : number, creationDate? : Date, significance? : number) {
        if(creationDate)
        {
            this.creationDate = creationDate;
        }
        else{
            this.creationDate = new Date();
        }

        this.id = id
        this.authorID = authorID;
        this.targetID = targetID;

        if(significance)
        {
            this.significance = significance;
        }
    }

    public getAuthorID(){
        return this.authorID;
    }

    public getAuthor(){
        if(this.authorID)
        {
            return UserManager.getInstance().getUserID(this.authorID);
        }
        else{
            return UserManager.getInstance().deletedUser();
        }

    }

    public getSignificance(){
        return this.significance
    }

    public getCreationDate(){
        return this.creationDate;
    }

    public getID() {
        return this.id
    }

    public setID(id : number) {
        this.id = id
    }

    public async getApplied()
    {
        await prisma.amendment.update({
            where : {
                ID : this.getID()
            },
            data : {
                applied : true
            }
        })
    }
}

export default Amendment;