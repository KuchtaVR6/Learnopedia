import LessonPart, {displayableOutput} from "./LessonPart";
import {InvalidArgument} from "../tools/Errors";

export type EmbeddableOutput = {
    uri: string,
    type: string
}

export type EmbeddableInput = {
    uri: string,
}

export class Embeddable extends LessonPart {

    private readonly uri: string;
    private readonly type: string;

    public static getType(uri : string) {
        if(uri.startsWith("https://www.youtube.com/embed/"))
            return "Youtube"
        if(uri.startsWith("gist/"))
            return "GithubGist"
        let split = uri.split(".")
        let extension = split[split.length-1]
        let allowedExtensions = ["apng","gif","ico","cur","jpg","jpeg","jfif","pjpeg","pjp","png","svg"];
        if(allowedExtensions.indexOf(extension)>=0) {
            return "ExternalImage"
        }
        throw new InvalidArgument("Embeddable","must conform to a Embeddable type: Youtube, GithubGist, ExternalImage")
    }

    public constructor(id: number, seqNumber: number, uri: string, type: string) {
        super(id, seqNumber);

        this.type = type;

        this.uri = uri;
    }

    public getDisplayable(): displayableOutput {
        return {
            id: this.getID(),
            seqNumber: this.getSeqNumber(),
            output:
                {
                    __typename: "EmbeddableOutput",
                    uri : this.type === "GithubGist"? this.uri.slice(5) : this.uri,
                    type : this.type
            }
        }
    }
}