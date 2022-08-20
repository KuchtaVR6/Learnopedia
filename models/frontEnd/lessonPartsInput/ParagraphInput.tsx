import {Dispatch, FC, SetStateAction, useEffect, useState} from "react";
import {LessonPartInputs} from "../../backEnd/lessonParts/LessonPartManager";
import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";
import EvaluatorInput from "../inputs/evaluatorInput";

type args = {
    setChanges: Dispatch<SetStateAction<LessonPartInputs | null>>,
    current? : displayableOutput
}

const ParagraphInput: FC<args> = ({setChanges, current}) => {

    const[basicText, setBasicText] = useState<string>(current && current.output.basicText? current.output.basicText : "")
    const[advancedText, setAdvText] = useState<string>(current && current.output.advancedText? current.output.advancedText : "")

    useEffect(() => {
        if(current)
        {
            if(basicText.length>0 && ((basicText !== current.output.basicText) || (advancedText != current.output.advancedText)))
            {
                if(advancedText.length === 0)
                {
                    setChanges({
                        basicText: basicText,
                        advancedText: null
                    })
                }
                setChanges({
                    basicText: basicText,
                    advancedText: advancedText
                })
            }
            else {
                setChanges(null)
            }
        }
        else {
            if (basicText.length > 0) {
                if (advancedText.length === 0) {
                    setChanges({
                        basicText: basicText,
                        advancedText: null
                    })
                }
                setChanges({
                    basicText: basicText,
                    advancedText: advancedText
                })
            }
        }
    },[basicText,advancedText])

    const conditionBasic = (input : string) => {
        if(input.length < 50)
        {
            throw new Error("Your text is too short 📏 (min 50 chars)")
        }

        if(input.length > 1000)
        {
            throw new Error("Your text is too long 📏 (max 1000 chars)")
        }
    }

    const conditionAdvanced = (input : string) => {
        if(input.length < 50 && input.length !== 0)
        {
            throw new Error("Your text is too short 📏 (min 50 chars)")
        }

        if(input.length > 1000)
        {
            throw new Error("Your text is too long 📏 (max 1000 chars)")
        }
    }

    return (
        <>
            <p>
                Basic Text (required):
            </p>
            <EvaluatorInput condition={conditionBasic} setInput={setBasicText} textarea={{rows : 12, columns : 100}} value={basicText} />
            <p>
                Advanced Text:
            </p>
            <EvaluatorInput condition={conditionAdvanced} setInput={setAdvText} textarea={{rows : 12, columns : 100}} value={advancedText} />
            <table>
                <tbody>
                    <tr>
                        <td>
                            Basic Text:
                        </td>
                        <td>
                            {basicText.length > 0? (!current || basicText !== current.output.basicText)? "✔" : "📕" : "❌"}
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}

export default ParagraphInput;