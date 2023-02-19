import Amendment, {
    AmendmentOpinionValues,
    AmendmentTypes,
    LevelSupport,
    SpecificAmendmentOutput,
    VotingSupport
} from "./Amendment";
import ContentManager from "../contents/ContentManager";
import {contentShareOutput, ContentType} from "../contents/Content";


class AdoptionAmendment extends Amendment {

    public readonly newParent: number;

    public constructor(
        id: number,
        authorID: number | null,
        targetID: number,
        newParent: number,
        secondary:
            { dbInput: false, otherSignificance: number } |
            { dbInput: true, creationDate: Date, significance: number, tariff: number, applied: boolean, opinions?: Map<number, AmendmentOpinionValues>, vetoed: boolean }) {
        super(
            id,
            authorID,
            targetID,
            secondary.dbInput ? secondary.significance : 1,
            secondary.dbInput ? secondary.tariff : secondary.otherSignificance,
            secondary.dbInput ? secondary.vetoed : undefined,
            secondary.dbInput ? secondary.creationDate : undefined,
            secondary.dbInput ? secondary.applied : undefined,
            secondary.dbInput ? secondary.opinions : undefined
        )
        this.newParent = newParent;
    }

    protected async getSpecificOutput(): Promise<SpecificAmendmentOutput> {
        return {
            __typename: "AdoptionAmendmentOutput",
            newParent: this.newParent,
            receiver: false
        }
    }

    public fullyFetched() {
        return true;
    }

    public async applyThisAmendment() {
        let content = await ContentManager.getInstance().getSpecificByID(this.getTargetID())
        await content.getAdopted(this)
        let parent = await ContentManager.getInstance().getSpecificByID(this.newParent)
        await parent.purgeListEdits()
    }

    public async getSupports(userID?: number): Promise<VotingSupport> {

        let contentManagerInstance = await ContentManager.getInstance()

        let target = await contentManagerInstance.getSpecificByID(this.targetID)
        let target2 = await contentManagerInstance.getSpecificByID(this.newParent)

        let finalArray: LevelSupport[] = [
            {
                max: 0,
                positives: 0,
                negatives: 0,
            },
            {
                max: 0,
                positives: 0,
                negatives: 0,
            },
            {
                max: 0,
                positives: 0,
                negatives: 0,
            }
        ];

        let userOP: number | undefined = undefined; // -2 report, -1 negative, 1 positive

        const changeFinalArray = (level: contentShareOutput, levelNo: number, op: AmendmentOpinionValues) => {
            finalArray[levelNo].max += level.maximum //important difference!!! (due to the nature of this amendment (two stakeholders))
            if (op === AmendmentOpinionValues.Positive) {
                finalArray[levelNo].positives += level.owned
            } else {
                finalArray[levelNo].negatives += level.owned
            }
        }

        this.opinions.forEach((op, user) => {
            let significances = target.getContentShareOfUser(user);
            let significances2 = target2.getContentShareOfUser(user);

            if (userID === user) {
                switch (op) {
                    case AmendmentOpinionValues.Negative:
                        userOP = -1;
                        break;
                    case AmendmentOpinionValues.Positive:
                        userOP = 1;
                        break;
                    case AmendmentOpinionValues.Report:
                        userOP = -2;
                        break;
                }
            }

            significances.forEach((level) => {
                switch (level.level) {
                    case ContentType.LESSON:
                        changeFinalArray(level, 2, op)
                        break;
                    case ContentType.CHAPTER:
                        changeFinalArray(level, 1, op)
                        break;
                    case ContentType.COURSE:
                        changeFinalArray(level, 0, op)
                        break;
                }
            })
            significances2.forEach((level => {
                switch (level.level) {
                    case ContentType.LESSON:
                        changeFinalArray(level, 2, op)
                        break;
                    case ContentType.CHAPTER:
                        changeFinalArray(level, 1, op)
                        break;
                    case ContentType.COURSE:
                        changeFinalArray(level, 0, op)
                        break;
                }
            }))
        })

        let cutArray: LevelSupport[] = [];

        finalArray.map((each) => {
            if (each.max > 0) {
                cutArray.push(each)
            }
        })

        return {
            amendmentID: this.id,
            individualSupports: cutArray,
            userOP: userOP
        }
    }

    public getType(): AmendmentTypes {
        return AmendmentTypes.AdoptionAmendment
    }
}

export default AdoptionAmendment;