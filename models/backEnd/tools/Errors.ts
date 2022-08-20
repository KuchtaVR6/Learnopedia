export class UserNotFoundException extends Error{
    public constructor(query : string) {
        super("User with the: " + query + ", doesn't exist in the system.")
    }
}

export class ContentNotFoundException extends Error{
    public constructor(id : number) {
        super("Content with the: " + id + ", doesn't exist in the system.")
    }
}

export class MaxPasswordLengthExceeded extends Error{
    public constructor(length : number) {
        super("Provided password exceeds the limit of 72 bytes. Your password is "+length+" bytes long.");
    }
}

export class SessionHasBeenInvalidated extends Error{
    public constructor() {
        super("Session has been invalidated.");
    }
}

export class ActionNotDefined extends Error{
    public constructor() {
        super("This action is not defined as email validated");
    }
}

export class CredentialsNotUnique extends Error{
    public constructor() {
        super("The email or nickname is not unique");
    }
}

export class CodeMismatch extends Error{
    public constructor() {
        super("Provided code is incorrect");
    }
}

export class EmptyModification extends Error{
    public constructor() {
        super("Provided modification is empty");
    }
}

export class ContentNotFetched extends Error{
    public constructor() {
        super("Content is not fetched yet");
    }
}

export class ContentNotNavigable extends Error{
    public constructor() {
        super("Fetched content is non-navigable. Try accessing it through proposed amendments.");
    }
}

export class ContentNeedsParent extends Error{
    public constructor() {
        super("All content (except for courses) need a parent.");
    }
}

export class CourseHasNoParent extends Error {
    public constructor() {
        super("Courses can not be adopted as they have no parents");
    }
}

export class SequenceNumberTaken extends Error {
    public constructor() {
        super("Provided Sequence Number is Taken");
    }
}

export class UnsupportedOperation extends Error {
    public constructor(classname : string, operation : string) {
        super("Class "+classname+" doesn't support "+operation);
    }
}

export class NotFoundException extends Error{
    public constructor(searched : string, id : number) {
        super(searched +" with the: " + id + ", doesn't exist in the system.")
    }
}

export class MissingLessonPart extends Error{
    public constructor() {
        super("This amendment it's missing the LessonPartID");
    }
}

export class OrphanedContent extends Error{
    public constructor() {
        super("You cannot create a Chapter or Lesson without parentID");
    }
}

export class NoChanges extends Error{
    public constructor() {
        super("No changes where included in the amendment");
    }
}

export class LessonCannotBeParent extends Error{
    public constructor() {
        super("A lesson cannot be a parent for any content");
    }
}

export class WrongParent extends Error{
    public constructor(child : string, parent : string) {
        super("Class " + parent + " cannot be " + child + "'s parent.");
    }
}

export class InvalidArgument extends Error{
    public constructor(child : string, doesntMeet : string)
    {
        super("Argument " + child + " doesn't meet the requirement: " + doesntMeet)
    }
}

export class LegacyAmendment extends Error{
    public constructor() {
        super("Provided Amendment was created on Content that doesn't exist anymore.");
    }
}