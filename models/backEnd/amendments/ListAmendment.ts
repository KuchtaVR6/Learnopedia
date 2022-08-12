import Amendment from "./Amendment";

class ListAmendment extends Amendment{
    public readonly changes : {ChildID : number, newSeqNumber? : number, delete? : boolean}[];

    public constructor(id : number, authorID : number, targetID : number, changes : {ChildID : number, newSeqNumber? : number, delete? : boolean}[]) {
        super(id, authorID, targetID);
        this.changes = changes;
    }
}

export default ListAmendment;