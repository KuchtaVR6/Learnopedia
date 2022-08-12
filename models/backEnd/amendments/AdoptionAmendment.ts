import Amendment from "./Amendment";

class AdoptionAmendment extends Amendment{

    public readonly newParent : number;

    public constructor(id : number, authorID : number, targetID : number, newParent : number) {
        super(id, authorID, targetID)
        this.newParent = newParent;
    }

}

export default AdoptionAmendment;