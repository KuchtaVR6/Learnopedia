import {gql} from "apollo-server-micro";

export const typeDefs = gql`
    type User {
        nickname: String!
        email: String!
        lname: String!
        fname: String!
        XP : Int!
        avatarPath: String!
        colorA: String!
        colorB: String!
    }
    type AuthResponse{
        authorisation : Boolean!
    }
    type ContinueResponse{
        continue : Boolean!
    }
    type VacancyResponse{
        query : String!
        vacant : Boolean!
    }
    
    # display types
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
        authors: String!,
        upVotes: Int!,
        downVotes: Int!
    }
    union unionisedOutput = ParagraphOutput | EmbeddableOutput | QuizQuestionOutput
    type displayableOutput{
        id : Int!
        seqNumber : Int!
        output : unionisedOutput!
    }
    type ParagraphOutput {
        basicText : String!,
        advancedText : String
    }
    type EmbeddableOutput {
        uri : String!
        type : String!
    }
    type QuizQuestionOutput {
        question : String!
        type : String!
        answer : [Answer!]!
    }
    type Answer {
        answerID : Int!,
        content : String!,
        correct : Boolean!,
        feedback : String
    }
    type ChapterOutput {
        meta: MetaContent!,
        lessons: [MetaContent!]
    }
    type CourseOutput {
        meta: MetaContent!,
        chapters: [ChapterOutput!]!
    }
    type FullOutput{
        metas: CourseOutput!,
        content: [displayableOutput!]
    }
    type viewOutput{
        mainMeta : MetaContent,
        output : FullOutput
    }
    type searchResult{
        score : Int!,
        content : MetaContent!
    }
    
    #amendmentsOutput start
    type ChangesOutput{
        ChildID: Int,
        LessonPartID: Int,
        newSeqNumber: Int,
        delete: Boolean
    }
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
        oldID : Int,
        old : displayableOutput
    }
    type AdoptionAmendmentOutput {
        newParent : Int!,
        receiver : Boolean,
    }
    union SpecificAmendmentOutput = MetaAmendmentOutput |
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
        applied : Boolean!,
        vetoed : Boolean!,
        otherDetails : SpecificAmendmentOutput
    }
    
    #voting display outputs
    type VotingSupport {
        amendmentID : Int!,
        individualSupports : [LevelSupport]
        userOP: Int
    }
    type LevelSupport {
        negatives : Int!,
        positives : Int!,
        max : Int!,
    }

    #image types
    type ForDeletion{
        file : String
    }
    
    type voteOutput {
        vote : Boolean
    }
    type countMyView {
        vote : Boolean,
        bookmark : Boolean,
        reminderDate : String,
    }

    # content modification types
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
    input Changes{
        ChildID: Int,
        LessonPartID: Int,
        newSeqNumber: Int,
        delete: Boolean!
    }

    # lessonPart modification types
    input QuizQuestionInput {
        question : String!
        type : String!
        answer : [AnswerInput!]!
    }
    input AnswerInput {
        content : String!,
        correct : Boolean!,
        feedback : String
    }
    input EmbeddableInput {
        uri : String!,
        localCacheImage: Boolean!
    }
    input ParagraphInput {
        basicText : String!,
        advancedText : String
    }

    type Query {
        logout : AuthResponse,
        getUser(nickname : String) : User,
        vacantEmail(email : String!) : VacancyResponse,
        vacantNickname(nickname : String!) : VacancyResponse,

        search(query : String!) : [searchResult],
        view(id : Int!) : viewOutput

        getRecommended(loggedIn : Boolean) : [MetaContent]

        getUsersAmendments(nickname : String) : [AmendmentOutput],
        getContentAmendments(id : Int!) : [AmendmentOutput]

        #image resolvers
        avatarAuthorise : ForDeletion
        uploadAuthorise : ForDeletion
        getUploadedImageLink : ForDeletion

        MODERATOR_fetchReported : [AmendmentOutput]

        checkAmendmentVotes(amendmentIds : [Int!]!): [VotingSupport]
    }

    type Mutation{
        addUser(nickname : String!, email : String!, lname : String!, fname : String!, password : String!, captchaToken : String!) : ContinueResponse
        modifyUser(nickname : String, lname : String, fname : String, colorA : String, colorB : String) : User
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

        createEmbeddable(targetID : Int!, seqNumber : Int!, args : EmbeddableInput!) : ContinueResponse
        modToEmbeddable(targetID : Int!, seqNumber : Int!, oldID : Int!, args : EmbeddableInput!) : ContinueResponse

        createQuizQuestion(targetID : Int!, seqNumber : Int!, args : QuizQuestionInput!) : ContinueResponse
        modToQuizQuestion(targetID : Int!, seqNumber : Int!, oldID : Int!, args : QuizQuestionInput!) : ContinueResponse

        listAmendment(targetID : Int!, changes : [Changes!]!) : ContinueResponse
        adoptionAmendment(targetID : Int!, newParent : Int!) : ContinueResponse

        #upVote downVote
        vote(contentID : Int!, positive : Boolean!) : ContinueResponse
        countMyView(id : Int!, loggedIn : Boolean!) : countMyView

        deleteBookmark(contentID : Int!) : ContinueResponse
        appendBookmark(contentID : Int!, reminderDate : String) : ContinueResponse

        #image resolvers
        avatarFinalise(newPath : String!) : ContinueResponse
        uploadFinalise(newPath : String!) : ContinueResponse
        
        MODERATOR_hideContent(contentID : Int!) : ContinueResponse
        MODERATOR_suspendUser(userNickname : String!, suspensionLift : String!, reason : String!) : ContinueResponse
        
        voteOnAmendment(amendmentID : Int!, positive: Boolean, negative: Boolean, report: Boolean) : VotingSupport
    }
`;