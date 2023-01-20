import Amendment, {AmendmentOpinionValues, SpecificAmendmentOutput} from "./Amendment";
import prisma from "../../../prisma/prisma";
import ContentManager from "../contents/ContentManager";

export type AdoptionAmendmentOutput = {
    __typename: "AdoptionAmendmentOutput",
    newParent : number,
    receiver : boolean
}

class AdoptionAmendment extends Amendment{

    public readonly newParent : number;
    private receivingAmendmentID : number | null = null;

    public constructor(
        id : number,
        authorID : number | null,
        targetID : number,
        newParent : number,
        secondary :
            {dbInput : false, otherSignificance : number} |
            {dbInput : true, creationDate : Date, significance : number, tariff : number, applied : boolean, opinions?: Map<number,AmendmentOpinionValues>, vetoed : boolean})
    {
        super(
            id,
            authorID,
            targetID,
            secondary.dbInput? secondary.significance : 1,
            secondary.dbInput? secondary.tariff : secondary.otherSignificance,
            secondary.dbInput? secondary.vetoed : undefined,
            secondary.dbInput? secondary.creationDate : undefined,
            secondary.dbInput? secondary.applied : undefined,
            secondary.dbInput? secondary.opinions : undefined
            )
        this.newParent = newParent;
    }

    public setReceivingAmendmentID(id : number) {
        this.receivingAmendmentID = id;
    }

    public async getApplied()
    {
        if(!this.receivingAmendmentID)
        {
            throw new Error("Adoption receiver amendment cannot be applied.")
        }

        await super.getApplied()

        await prisma.amendment.update({
            where : {
                ID : this.receivingAmendmentID
            },
            data : {
                applied : true
            }
        })
    }

    protected async getSpecificOutput() : Promise<SpecificAmendmentOutput> {
        return {
            __typename: "AdoptionAmendmentOutput",
            newParent : this.newParent,
            receiver : !this.receivingAmendmentID
        }
    }

    public fullyFetched()
    {
        return true;
    }

    public async applyThisAmendment() {
        let content = await ContentManager.getInstance().getSpecificByID(this.getTargetID())

        await content.getAdopted(this)

        let parent = await ContentManager.getInstance().getSpecificByID(this.newParent)

        await parent.purgeListEdits()
    }
}

export default AdoptionAmendment;