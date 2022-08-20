import {gql} from "apollo-server-micro";

export const typeDefs = gql`
    type User {
        nickname: String!
        email: String!
        lname: String!
        fname: String!
        XP : Int!
    }

    type AuthResponse{
        authorisation : Boolean!
    }

    type ContinueResponse{
        continue : Boolean!
    }

    #start of helper types

    type keyword{
        ID : Int!,
        Score : Int!,
        word : String!,
    }

    type MetaContent {
        id : Int!,
        name : String!,
        description : String!,
        keywords: [keyword!]!,
        type : Int!,
        seqNumber : Int!,
        creation: String!,
        modification: String!,
        authors: String!
    }

    union unionisedOutput = ParagraphOutput | VideoOutput

    type displayableOutput{
        id : Int!
        seqNumber : Int!
        output : unionisedOutput!
    }

    type ParagraphOutput {
        basicText : String!,
        advancedText : String
    }

    type VideoOutput {
        url : String
    }

    input ParagraphInput {
        basicText : String!,
        advancedText : String
    }

    type ChapterOutput {
        meta: MetaContent!,
        lessons: [MetaContent!]
    }

    type CourseOutput {
        meta: MetaContent!,
        chapters: [ChapterOutput!]!
    }

    input MetaAmendmentChanges{
        newName : String,
        newDescription : String,
        addedKeywords : [keywordInput!],
        deletedKeywordIDs : [Int!]
    }

    input keywordInput{
        Score : Int!,
        word : String!,
    }

    type FullOutput{
        metas: CourseOutput!,
        content: [displayableOutput!]
    }

    input Changes{
        ChildID: Int,
        LessonPartID: Int,
        newSeqNumber: Int,
        delete: Boolean!
    }

    type ChangesOutput{
        ChildID: Int,
        LessonPartID: Int,
        newSeqNumber: Int,
        delete: Boolean
    }

    #end of helper types

    type viewOutput{
        mainMeta : MetaContent,
        output : FullOutput
    }

    type searchResult{
        score : Int!,
        content : MetaContent!
    }
    
    #amendmentsOutput start

    type MetaAmendmentOutput {
        newName : String,
        newDescription : String,
        addedKeywords : [keyword!],
        deletedKeywords : [keyword!]
    }

    type ListAmendmentOutput {
        listChanges : [ChangesOutput!]
    }
    
    type CreationAmendmentOutput {
        name : String!,
        description : String!,
        keywords : [keyword!],
        seqNumber : Int!,
    }

    type PartAddReplaceAmendmentOutput {
        change : displayableOutput,
        seqNumber : Int!
        oldID : Int
    }

    type AdoptionAmendmentOutput {
        newParent : Int!,
        receiver : Boolean,
    }
    
    #amendmentsOutput end
    
    union SpecificAmendmentOutput = 
        MetaAmendmentOutput | 
        ListAmendmentOutput | 
        CreationAmendmentOutput | 
        PartAddReplaceAmendmentOutput |
        AdoptionAmendmentOutput
    
    type AmendmentOutput{
        id : Int!,
        creatorNickname : String!,
        creationDate : String!,
        significance : Int!,
        tariff : Int!,
        targetMeta : MetaContent,
        applied : Int!,
        otherDetails : SpecificAmendmentOutput
    }

    type Query {
        logout : AuthResponse,
        getUser(nickname : String) : User,
        vacantEmail(email : String!) : ContinueResponse,
        vacantNickname(nickname : String!) : ContinueResponse,

        search(query : String!) : [searchResult],
        view(id : Int!) : viewOutput
        getRecommended : [MetaContent]

        getUsersAmendments(nickname : String) : [AmendmentOutput],
        getContentAmendments(id : Int!) : [AmendmentOutput]
    }

    type Mutation{
        addUser(nickname : String!, email : String!, lname : String!, fname : String!, password : String!, captchaToken : String!) : ContinueResponse
        modifyUser(nickname : String, lname : String, fname : String) : User
        deleteUser : ContinueResponse
        forgotPassword(email : String!, captchaToken : String!) : ContinueResponse

        changeEmail(email : String!) : ContinueResponse
        changePassword(password : String!) : ContinueResponse

        verifyCode(code : Int!) : AuthResponse
        verifyCodeUnverified(code : Int!) : AuthResponse

        login(login : String!,password : String!) : AuthResponse
        requestAccessToken : AuthResponse

        creationAmendment(name : String!, description : String!, keywords : [keywordInput!]!, seqNumber : Int!, type : Int!, parentID : Int ) : ContinueResponse
        metaAmendment(targetID: Int!, changes : MetaAmendmentChanges) : ContinueResponse

        createParagraph(targetID : Int!, seqNumber : Int!, args : ParagraphInput!) : ContinueResponse
        modToParagraph(targetID : Int!, seqNumber : Int!, oldID : Int!, args : ParagraphInput!) : ContinueResponse

        listAmendment(targetID : Int!, changes : [Changes!]!) : ContinueResponse
        adoptionAmendment(targetID : Int!, newParent : Int!) : ContinueResponse
    }
`;