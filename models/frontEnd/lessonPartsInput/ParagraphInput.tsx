import {Dispatch, FC, SetStateAction, useEffect, useState} from "react";
import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";
import EvaluatorInput from "../inputs/evaluatorInput";
import {lessonPartArgs, lessonPartTypes} from "../../backEnd/lessonParts/LessonPartTypes";
import ParagraphDisplay from "../contentDisplays/ParagraphDisplay";

type args = {
    setChanges: Dispatch<SetStateAction<lessonPartArgs | null>>,
    current?: displayableOutput
}

const ParagraphInput: FC<args> = ({setChanges, current}) => {

    const [basicText, setBasicText] = useState<string>(current && current.output.__typename === "ParagraphOutput" ? current.output.basicText : "")
    const [advancedText, setAdvText] = useState<string>(current && current.output.__typename === "ParagraphOutput" ? current.output.advancedText ? current.output.advancedText : "" : "")

    useEffect(() => {
        if (current) {
            if (basicText.length > 0 && (current.output.__typename !== "ParagraphOutput" || ((basicText !== current.output.basicText) || (advancedText != current.output.advancedText)))) {
                if (advancedText.length === 0) {
                    setChanges({
                        content: {
                            basicText: basicText,
                            advancedText: null
                        },
                        type: lessonPartTypes.PARAGRAPH
                    })
                }
                setChanges({
                    content: {
                        basicText: basicText,
                        advancedText: advancedText
                    },
                    type: lessonPartTypes.PARAGRAPH
                })
            } else {
                setChanges(null)
            }
        } else {
            if (basicText.length > 0) {
                if (advancedText.length === 0) {
                    setChanges({
                        content: {
                            basicText: basicText,
                            advancedText: null
                        },
                        type: lessonPartTypes.PARAGRAPH
                    })
                }
                setChanges({
                    content: {
                        basicText: basicText,
                        advancedText: advancedText
                    },
                    type: lessonPartTypes.PARAGRAPH
                })
            }
        }
    }, [basicText, advancedText, current, setChanges])

    const conditionBasic = (input: string) => {
        if (input.length < 50) {
            throw new Error("Your text is too short 📏 (min 50 chars)")
        }

        if (input.length > 1000) {
            throw new Error("Your text is too long 📏 (max 1000 chars), please split it into multiple paragraphs.")
        }
    }

    const conditionAdvanced = (input: string) => {
        if (input.length < 5 && input.length !== 0) {
            throw new Error("Your text is too short 📏 (min 5 chars)")
        }

        if (input.length > 1000) {
            throw new Error("Your text is too long 📏 (max 1000 chars)")
        }
    }

    return (
        <>
            <p>
                Basic Text (required):
            </p>
            <EvaluatorInput condition={conditionBasic} setInput={setBasicText} textarea={{rows: 12, columns: 100}}
                            value={basicText}/>
            <p>
                Heading Text:
            </p>
            <EvaluatorInput condition={conditionAdvanced} setInput={setAdvText} textarea={{rows: 12, columns: 100}}
                            value={advancedText}/>
            <table>
                <tbody>
                <tr>
                    <td>
                        Basic Text:
                    </td>
                    <td>
                        {basicText.length > 0 ? (!current || (current.output.__typename !== "ParagraphOutput" || basicText !== current.output.basicText)) ? "✔" : "📕" : "❌"}
                    </td>
                </tr>
                </tbody>
            </table>
            {basicText.length > 0 ? "Preview:" : ""}
            <div style={{border: "5px solid", padding: "0 20px"}}>
                <ParagraphDisplay basicText={basicText} advancedText={advancedText}/>
            </div>
        </>
    )
}

export default ParagraphInput;