import {AnchorHTMLAttributes, DetailedHTMLProps, FC, useEffect, useState} from "react";
import {ParagraphOutput} from "../../backEnd/lessonParts/Paragraph";

type args = ParagraphOutput

const ParagraphDisplay: FC<args> = (input) => {

    const [paragraphText, setParagraphText] = useState<(string | DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>)[]>([])

    const renderText = (text: string) => {
        let textSplit = text.split(" ")
        let processedText: (string | DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>)[] = [""]
        let indexInProcessedText = 0

        //findLinks
        for (let word of textSplit) {
            if (word.startsWith("http://") || word.startsWith("https://") || word.startsWith("www.")) {
                //if custom link text set
                let x = word.split("~")

                let name = x[0];
                let link = x[0];

                if (x.length === 2) {
                    name = x[1]
                }

                processedText.push(
                    <a
                        href={link} rel="noreferrer" target="_blank"
                        onClick={(e) => {
                            if (!window.confirm("Redirecting to an external link: " + link)) {
                                e.preventDefault()
                            }
                        }}> {name.replaceAll("_", " ")} </a>)
                processedText.push("")
                indexInProcessedText += 2;
            } else {
                processedText[indexInProcessedText] += word + " "
            }
        }

        let finalProcessedText: (string | DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>)[] = [""];
        indexInProcessedText = 0;

        for (let text of processedText) {
            if (typeof text === 'string') {
                //find triple stars
                let starSplit = text.split("***")
                for (let i = 0; i < starSplit.length; i++) {
                    if (i % 2 == 0) {
                        //find double stars in remaining text
                        let starSplitInner = starSplit[i].split("**")
                        for (let j = 0; j < starSplitInner.length; j++) {
                            if (j % 2 == 0) {
                                let starSplitInnerOneStar = starSplitInner[j].split("*")
                                for (let k = 0; k < starSplitInnerOneStar.length; k++) {
                                    if (k % 2 == 0) {
                                        finalProcessedText[indexInProcessedText] += starSplitInnerOneStar[k].replaceAll("/", "");
                                    } else {
                                        finalProcessedText.push(<i>{starSplitInnerOneStar[k].replaceAll("/", "")}</i>)
                                        finalProcessedText.push("")
                                        indexInProcessedText += 2;
                                    }
                                }
                            } else {
                                finalProcessedText.push(<b>{starSplitInner[j].replaceAll("/", "")}</b>)
                                finalProcessedText.push("")
                                indexInProcessedText += 2;
                            }
                        }
                    } else {
                        finalProcessedText.push(<b><i>{starSplit[i].replaceAll("/", "")}</i></b>)
                        finalProcessedText.push("")
                        indexInProcessedText += 2;
                    }
                }
            } else {
                finalProcessedText.push(text)
                finalProcessedText.push("")
                indexInProcessedText += 2;
            }
        }

        setParagraphText(finalProcessedText)
    }

    useEffect(() => {
        renderText(input.basicText)
    }, [input])

    return (
        <>
            <br/>
            <h3>{input.advancedText}</h3>
            {paragraphText}
        </>
    )
}

export default ParagraphDisplay;