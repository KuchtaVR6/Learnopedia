import {FC, useEffect, useRef, useState} from "react";
import EvaluatorInput from "./evaluatorInput";

type args = {
    inputFile: File;
    setFile: (file: File | null) => void;
}

const SVGModifier: FC<args> = (props) => {

    const [groupName, setGroupName] = useState<string>("");
    const [groupText, setGroupText] = useState<string>("");
    const [groupColour, setGroupColour] = useState<string>("");
    const [textWidth, setTextWidth] = useState<number>(300)

    const selectedObjects = useRef<string[]>([]);
    const firstModification = useRef<boolean>(false);
    const svgWidth = useRef<number>(0)
    const processedSVGElement = useRef<HTMLDivElement>(null)

    /** walk through all the descendants of the node applying the given function to each **/
    function walkTheDOM(node: ChildNode, func: (node: ChildNode) => void) {
        func(node);
        for (let childNode of Array.from(node.childNodes)) {
            walkTheDOM(childNode, func);
        }
    }

    const registerClick = (e: MouseEvent, dblClick?: boolean) => {
        if (!dblClick) {
            if (e.shiftKey) {
                let thisId = (e.target as HTMLElement).id
                if (!selectedObjects.current.includes(thisId)) {
                    (e.target as HTMLElement).style.opacity = "0.5";
                    selectedObjects.current.push(thisId);
                }
            } else {
                removeSelections(selectedObjects.current);
                (e.target as HTMLElement).style.opacity = "0.5";
                selectedObjects.current = [(e.target as HTMLElement).id];
            }
        }
        else {
            if (e.shiftKey) {
                let thisId = (e.target as HTMLElement).id
                if(selectedObjects.current){
                    selectedObjects.current = selectedObjects.current.filter((row : string) => {return row !== thisId})
                }
                (e.target as HTMLElement).style.opacity = "1";
            }
        }
    }

    const removeSelections = (ids: string[]) => {
        for (let id of ids) {
            document.getElementById(id)!.style.opacity = "1";
        }
    }

    const produceOutputText = () => {
        if (processedSVGElement.current) {
            let output = "";

            for (let node of Array.from(processedSVGElement.current.childNodes)) {
                /** on first modification expand the width **/
                if (firstModification.current && (node as Element).nodeName === "svg") {
                    (node as Element).setAttribute("width", String(svgWidth.current + textWidth));
                }
                let x = (new XMLSerializer().serializeToString(node))
                x = (x.replaceAll("g xmlns=\"http://www.w3.org/1999/xhtml\"", "g"))
                x = (x.replaceAll("style xmlns=\"\"", "style"))
                output += x;
            }

            return output;
        }
        return ""
    }

    const parseSVG = async (theFile: File) => {
        let reader = new FileReader();
        reader.addEventListener("load", () => {
            // this will then display a text file
            if (reader.result && processedSVGElement.current) {
                processedSVGElement.current.innerText = "";

                let XMLParser = new DOMParser().parseFromString(reader.result as string, "image/svg+xml");
                let idsIdentified: string[] = [];
                let addedId = 100000;

                firstModification.current = !XMLParser.getElementById("svgStyle");

                for (let node of Array.from(XMLParser.childNodes)) {
                    walkTheDOM(node, (node) => {
                        if (firstModification.current) {
                            /** in the case that this is the first modification add the style element */
                            if ((node as HTMLElement).nodeName === "defs") {
                                let style = XMLParser.createElement("style")
                                style.id = "svgStyle"
                                style.setAttribute("type", "text/css")
                                node.appendChild(style)
                            }
                        }

                        /** record the width of the svg  */
                        if ((node as HTMLElement).nodeName === "svg") {
                            let widthS = (node as HTMLElement).getAttribute("width")
                            if (widthS) {
                                svgWidth.current = Number(widthS);
                            }
                        }

                        /** if element has id store it, else add it and then store it */
                        if ((node as HTMLElement).id) {
                            idsIdentified.push((node as HTMLElement).id)
                        } else {
                            (node as HTMLElement).id = "" + addedId
                            idsIdentified.push("" + addedId)
                            addedId += 1;
                        }
                    });
                    processedSVGElement.current.appendChild(node)
                }

                /** add eventListeners to all identified components */
                for (let id of idsIdentified) {
                    let elementIdentified = document.getElementById(id)
                    if (elementIdentified) {
                        elementIdentified.addEventListener("click", registerClick);
                        elementIdentified.addEventListener("dblclick",
                            (e) => {
                                registerClick(e, true);
                            });
                    }
                }
            }
        }, false);
        reader.readAsText(theFile)
    }

    const splitGroupText = (text: string, fontSize: number, width: number) => {
        let maxGroupSize = 2 * width / fontSize
        let textSplit = text.split(" ")
        let final: string[] = [""];
        let currentLength = 0;
        let currentIndex = 0;
        for (let word of textSplit) {
            if (word.length < maxGroupSize - currentLength) {
                final[currentIndex] += word + " "
                currentLength += word.length + 1
            } else {
                currentLength = word.length + 1;
                currentIndex += 1;
                final.push(word + " ");
            }
        }
        return final
    }

    const submitGroup = () => {
        if (selectedObjects.current.length > 0 && processedSVGElement.current) {
            let parentElement: HTMLElement = document.getElementById(selectedObjects.current[0])!.parentElement!;
            let inserter = document.createElement("g")
            inserter.id = groupName.replaceAll(" ","_");
            inserter.setAttribute("transform", "matrix(1,0,0,1,0,0)")
            for (let id of selectedObjects.current) {
                let child = document.getElementById(id)
                if (child) {
                    child.style.fill = groupColour;
                    child.style.opacity = "1";
                    inserter.appendChild(child.cloneNode(true))
                    child.parentElement!.removeChild(child)
                }
            }
            let explanation = document.createElement("g")
            explanation.className = "explanation"

            /** paragraph container */

            let paragraphContainer: HTMLElement[] = [];

            let yOffset = 55 - 21;

            /** appending the text line by line */
            for (let line of splitGroupText(groupText, 20, textWidth - 8)) {
                let paragraph = document.createElement("text")

                yOffset += 21

                /** setting the dimensions */
                paragraph.setAttribute("x", String((firstModification.current ? svgWidth.current : svgWidth.current - textWidth) + 4))
                paragraph.setAttribute("y", String(yOffset))
                paragraph.setAttribute("width", String(textWidth - 8));


                paragraph.style.fontFamily = "Ubuntu Mono"
                paragraph.style.fontSize = "20px"

                let paragraphText = document.createTextNode(line)

                paragraph.appendChild(paragraphText)
                paragraphContainer.push(paragraph)
            }

            yOffset += 4;

            /** rectangular container */
            let rect = document.createElement("rect")

            /** setting the dimensions */
            rect.setAttribute("x", String(firstModification.current ? svgWidth.current : svgWidth.current - textWidth))
            rect.setAttribute("y", "0")
            rect.setAttribute("height", String(yOffset))
            rect.setAttribute("width", String(textWidth))

            rect.style.stroke = "black";
            rect.style.fill = "white";
            rect.style.opacity = "0.9";

            /** headline */
            let headline = document.createElement("text")
            let headlineText = document.createTextNode(groupName)

            /** setting the dimensions */
            headline.setAttribute("x", String((firstModification.current ? svgWidth.current : svgWidth.current - textWidth) + 4))
            headline.setAttribute("y", "34")
            headline.setAttribute("height", "200")
            headline.setAttribute("width", String(textWidth - 8));

            headline.style.fontFamily = "Ubuntu Mono"
            headline.style.fontSize = "33px"

            headline.appendChild(headlineText)

            explanation.appendChild(rect)
            explanation.appendChild(headline)
            paragraphContainer.map((paragraph) => {
                explanation.appendChild(paragraph)
            })

            inserter.appendChild(explanation)
            parentElement.appendChild(inserter)

            let mainStyle = document.getElementById("svgStyle")!
            let innerStyle = document.createTextNode(
                `
                 #${inserter.id} .explanation { display: none; color: black; }
                 #${inserter.id}:hover .explanation { display: block; }
                `)
            mainStyle.appendChild(innerStyle)
            selectedObjects.current = []

            props.setFile(new File([produceOutputText()], "generated.svg"))
            processedSVGElement.current.innerText = ""
        }
    }

    useEffect(() => {
        parseSVG(props.inputFile)
    }, [props.inputFile])

    const nameValidator = (input: string) => {
        if (input.length < 0) {
            throw new Error("The name is required!")
        }
        if (input.length > (392 * 2) / 33) {
            setGroupName("")
            throw new Error("Text is too long! Max characters is " + String(Math.round((392 * 2) / 33)))
        }
        if(!input.match(/^[a-z ]*$/i)){
            setGroupName("")
            throw new Error("Special characters are unsupported")
        }
    }

    const textValidator = (input: string) => {
        if (input.length > ((392 * 2) / 20) * 6) {
            setGroupText("")
            throw new Error("Text is too long! Max characters is " + String(Math.round((392 * 2 * 6) / 20)))
        }
    }

    return <>
        <div ref={processedSVGElement} id={"processedSVG"} style={{maxWidth: "100%"}}></div>
        <hr/>
        <h2>SVG Modification - add groups with explanations!</h2>
        <p>Select one shape by clicking it on the image, or multiple by click whilst holding shift. When you select all
            of the shapes you want to group together name that group, and then add the optional explanation to the
            group. To deselect whilst holding shift double click on the shape.</p>
        <b>Group Name:</b><br/>
        <EvaluatorInput condition={nameValidator} setInput={setGroupName} width={28}/>
        <b>Group Text:</b><br/>
        <EvaluatorInput condition={textValidator} setInput={setGroupText} textarea={{rows: 5, columns: 28}}/>
        <b>Group Colour:</b><br/>
        <input type={"color"} onChange={(e) => {
            setGroupColour(e.target.value)
        }}/><br/>
        <button disabled={groupName.length === 0} onClick={submitGroup}>Add the group</button>
    </>
}

export default SVGModifier;