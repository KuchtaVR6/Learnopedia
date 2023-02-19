import {displayableOutput} from "../lessonParts/LessonPart";

export type AdoptionAmendmentOutput = {
    __typename: "AdoptionAmendmentOutput",
    newParent : number,
    receiver : boolean
}

export type PartAddReplaceAmendmentOutput = {
    __typename: "PartAddReplaceAmendmentOutput"
    change : displayableOutput | null
    seqNumber : number
    oldID? : number
    old? : displayableOutput
}

export type CreationAmendmentOutput = {
    __typename: "CreationAmendmentOutput",
    name : string,
    description : string,
    keywords : {ID : number, Score : number, word : string}[],
    seqNumber : number,
}

export type ListAmendmentOutput = {
    __typename: "ListAmendmentOutput",
    listChanges : { ChildID?: number, LessonPartID?: number, newSeqNumber?: number, delete?: boolean }[]
}

export type MetaAmendmentOutput = {
    __typename: "MetaAmendmentOutput",
    newName? : string,
    newDescription? : string,
    addedKeywords? : { ID : number, Score : number, word : string }[],
    deletedKeywords? : { ID : number, Score : number, word : string }[]
}