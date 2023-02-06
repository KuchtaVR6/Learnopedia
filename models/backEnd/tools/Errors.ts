export class ConsoleLoginError extends Error{
    public constructor(query : string) {
        if (process.env.NODE_ENV === 'development') {
            console.log(new Date(), query)
        }
        super(query)
    }
}

export class UserNotFoundException extends ConsoleLoginError{
    public constructor(query : string) {
        super("User with the: " + query + ", doesn't exist in the system.")
    }
}

export class ContentNotFoundException extends ConsoleLoginError{
    public constructor(id : number) {
        super("Content with the: " + id + ", doesn't exist in the system.")
    }
}

export class MaxPasswordLengthExceeded extends ConsoleLoginError{
    public constructor(length : number) {
        super("Provided password exceeds the limit of 72 bytes. Your password is "+length+" bytes long.");
    }
}

export class SessionHasBeenInvalidated extends ConsoleLoginError{
    public constructor() {
        super("Session has been invalidated.");
    }
}

export class ActionNotDefined extends ConsoleLoginError{
    public constructor() {
        super("This action is not defined as email validated");
    }
}

export class CredentialsNotUnique extends ConsoleLoginError{
    public constructor() {
        super("The email or nickname is not unique");
    }
}

export class CodeMismatch extends ConsoleLoginError{
    public constructor() {
        super("Provided code is incorrect");
    }
}

export class EmptyModification extends ConsoleLoginError{
    public constructor() {
        super("Provided modification is empty");
    }
}

export class ContentNotFetched extends ConsoleLoginError{
    public constructor() {
        super("Content is not fetched yet");
    }
}

export class ContentNotNavigable extends ConsoleLoginError{
    public constructor() {
        super("Fetched content is non-navigable. Try accessing it through proposed amendments.");
    }
}

export class ContentNeedsParent extends ConsoleLoginError{
    public constructor() {
        super("All content (except for courses) need a parent.");
    }
}

export class CourseHasNoParent extends ConsoleLoginError {
    public constructor() {
        super("Courses can not be adopted as they have no parents");
    }
}

export class SequenceNumberTaken extends ConsoleLoginError {
    public constructor() {
        super("Provided Sequence Number is Taken");
    }
}

export class UnsupportedOperation extends ConsoleLoginError {
    public constructor(classname : string, operation : string) {
        super("Class "+classname+" doesn't support "+operation);
    }
}

export class NotFoundException extends ConsoleLoginError{
    public constructor(searched : string, id : number) {
        super(searched +" with the: " + id + ", doesn't exist in the system.")
    }
}

export class MissingLessonPart extends ConsoleLoginError{
    public constructor() {
        super("This amendment it's missing the LessonPartID");
    }
}

export class OrphanedContent extends ConsoleLoginError{
    public constructor() {
        super("You cannot create a Chapter or Lesson without parentID");
    }
}

export class NoChanges extends ConsoleLoginError{
    public constructor() {
        super("No changes where included in the amendment");
    }
}

export class LessonCannotBeParent extends ConsoleLoginError{
    public constructor() {
        super("A lesson cannot be a parent for any content");
    }
}

export class WrongParent extends ConsoleLoginError{
    public constructor(child : string, parent : string) {
        super("Class " + parent + " cannot be " + child + "'s parent.");
    }
}

export class InvalidArgument extends ConsoleLoginError{
    public constructor(child : string, doesntMeet : string)
    {
        super("Argument " + child + " doesn't meet the requirement: " + doesntMeet)
    }
}

export class LegacyAmendment extends ConsoleLoginError{
    public constructor() {
        super("Provided Amendment was created on Content that doesn't exist anymore.");
    }
}

export class UserRobot extends ConsoleLoginError{
    public constructor() {
        super("hCaptcha verification failed");
    }
}