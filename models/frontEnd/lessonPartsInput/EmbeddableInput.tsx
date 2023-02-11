import {Dispatch, FC, SetStateAction, useEffect, useState} from "react";
import EvaluatorInput from "../inputs/evaluatorInput";
import {lessonPartArgs, lessonPartTypes} from "../../backEnd/lessonParts/LessonPartTypes";
import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";
import Link from "next/link";
import {gql, useQuery} from "@apollo/client";
import EmbeddableDisplay from "../contentDisplays/EmbeddableDisplay";
import {useRouter} from "next/router";

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
        if(uri.startsWith("https://youtu.be/") && uri.split("/").length===4) {
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
            setType("Image")
            return true
        }
        setType("Unrecognised")
        setInput("")
        throw new Error("Please read the tutorial to embedding links.")
    }

    const [hideInput, setHideInput] = useState<boolean>(false)
    const [input, setInput] = useState<string>("")
    const [parsedInput, setParsedInput] = useState<string>("")
    const [type, setType] = useState<string>("")

    const uploadedImageData = useQuery(gql`query GetUploadedImageLink {
        getUploadedImageLink {
            file
        }
    }`)

    const router = useRouter();

    useEffect(() => {
        if((type==="Image" || type==="Youtube" || type==="GithubGist") && input.length>0 && (!props.current || (props.current.output.__typename !== "EmbeddableOutput" || input !== props.current.output.uri)))
            props.setChanges({
                type : lessonPartTypes.EMBEDDABLE,
                content : {
                    uri : input,
                    localCacheImage : hideInput
                }
            })
        else {
            props.setChanges(null)
        }
    },[input,type,props])

    useEffect(() => {
        let uri = input;
        if(uri.startsWith("https://www.youtube.com/watch?v="))
            uri = "https://www.youtube.com/embed/" + uri.split("=")[1]
        else if(uri.startsWith("https://youtu.be/") && uri.split("/").length===4)
            uri = "https://www.youtube.com/embed/" + uri.split("/")[3]
        else if(uri.startsWith("https://gist.github.com/")) {
            uri = uri.split("/")[4]
        }

        setParsedInput(uri)
    })

    return <>
        <p>
            The link:
        </p>
        <div style={{display: hideInput? "none" : "inherit"}}>
            <EvaluatorInput condition={conditionBasic} setInput={setInput} width={50}
                            value={props.current?.output.__typename === "EmbeddableOutput"? props.current.output.uri : ""}/>
        </div>
        <button
            onClick={
            ()=> {
                if(uploadedImageData.data) {
                    if (hideInput) {
                        setInput("")
                    } else {
                        conditionBasic(uploadedImageData.data.getUploadedImageLink.file)
                        setInput(uploadedImageData.data.getUploadedImageLink.file)
                    }
                    setHideInput(!hideInput)
                }
            }}>
            {hideInput? "Use a different Link" : "Embed the image that you have uploaded"}
        </button>
        <br/>
        <div className={"buttonNiceContainer"}>
            <Link href={"/edit/imageUpload?red="+router.asPath}>Want to upload the image first? (CLICK HERE)</Link><br/>
        </div>

        <b>The type: {type} </b> <br/>


        {input.length > 0? "Preview:" : ""}
        <div style={{border: "5px solid"}}>
            <EmbeddableDisplay uri={hideInput? "/api/images/"+parsedInput : parsedInput} type={type} />
        </div>

        URI: {input.length > 0 ? (!props.current || (props.current.output.__typename !== "EmbeddableOutput" || input !== props.current.output.uri)) ? "✔" : "📕" : "❌"}
    </>
}

export default EmbeddableInput