import {Dispatch, FC, SetStateAction, useEffect, useState} from "react";
import EvaluatorInput from "../inputs/evaluatorInput";
import {lessonPartArgs, lessonPartTypes} from "../../backEnd/lessonParts/LessonPartTypes";
import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";

type args = {
    setChanges: Dispatch<SetStateAction<lessonPartArgs | null>>,
    current?: displayableOutput
}

const EmbeddableInput: FC<args> = (props) => {

    const conditionBasic = (uri : string) => {
        if(uri.startsWith("https://www.youtube.com/watch?v=") && uri.split("=").length===2) {
            setType("Youtube")
            return true
        }
        if(uri.startsWith("https://gist.github.com/") && uri.split("/").length===5) {
            setType("GithubGist")
            return true
        }
        let split = uri.split(".")
        let extension = split[split.length-1]
        let allowedExtensions = ["apng","gif","ico","cur","jpg","jpeg","jfif","pjpeg","pjp","png","svg"];
        if(allowedExtensions.indexOf(extension)>=0) {
            setType("ExternalImage")
            return true
        }
        setType("Unrecognised")
        setInput("")
        throw new Error("Please read the tutorial to embedding links.")
    }

    const [input, setInput] = useState<string>("")
    const [type, setType] = useState<string>("")

    useEffect(() => {
        if((type==="ExternalImage" || type==="Youtube" || type==="GithubGist") && input.length>0 && (!props.current || (props.current.output.__typename !== "EmbeddableOutput" || input !== props.current.output.uri)))
            props.setChanges({
                type : lessonPartTypes.EMBEDDABLE,
                content : {
                    uri : input
                }
            })
        else {
            props.setChanges(null)
        }
    },[input,type])

    return <>
        <p>
            The link:
        </p>
        <EvaluatorInput condition={conditionBasic} setInput={setInput} width={50}
                        value={props.current?.output.__typename === "EmbeddableOutput"? props.current.output.uri : ""}/>
        <b>The type: {type} </b> <br/>
        URI: {input.length > 0 ? (!props.current || (props.current.output.__typename !== "EmbeddableOutput" || input !== props.current.output.uri)) ? "✔" : "📕" : "❌"}
    </>
}

export default EmbeddableInput