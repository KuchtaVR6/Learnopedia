import LessonPart, {displayableOutput} from "./LessonPart";
import {InvalidArgument} from "../tools/Errors";

export type EmbeddableOutput = {
    uri: string,
    type: string
}

export type EmbeddableInput = {
    uri: string,
    localCacheImage: boolean
}

export class Embeddable extends LessonPart {

    private readonly uri: string;
    private readonly type: string;

    public static getType(uri : string) {
        if(uri.startsWith("https://www.youtube.com/watch?v=") && uri.split("=").length===2)
            return "Youtube"
        if(uri.startsWith("https://youtu.be/") && uri.split("/").length===4)
            return "Youtube"
        if(uri.startsWith("https://gist.github.com/") && uri.split("/").length===5)
            return "GithubGist"
        let split = uri.split(".")
        let extension = split[split.length-1]
        let allowedExtensions = ["apng","gif","ico","cur","jpg","jpeg","jfif","pjpeg","pjp","png","svg"];
        if(allowedExtensions.indexOf(extension)>=0) {
            return "Image"
        }
        throw new InvalidArgument("Embeddable","must conform to a Embeddable type: Youtube, GithubGist, Image")
    }

    public constructor(id: number, seqNumber: number, uri: string, type: string) {
        super(id, seqNumber);

        this.type = type;

        this.uri = uri
    }

    public getDisplayable(): displayableOutput {
        return {
            id: this.getID(),
            seqNumber: this.getSeqNumber(),
            output:
                {
                    __typename: "EmbeddableOutput",
                    uri : this.uri,
                    type : this.type
            }
        }
    }
}