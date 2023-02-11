import {Dispatch, FC, SetStateAction} from "react";
import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";
import {InvalidArgument} from "../../backEnd/tools/Errors";
import ParagraphInput from "../lessonPartsInput/ParagraphInput";
import {lessonPartArgs} from "../../backEnd/lessonParts/LessonPartTypes";
import QuizQuestionInput from "../lessonPartsInput/QuizQuestionInput";
import EmbeddableInput from "../lessonPartsInput/EmbeddableInput";

type args = {
    current?: displayableOutput
    others?: displayableOutput[],
    disableSetType?: boolean,
    setChanges: Dispatch<SetStateAction<lessonPartArgs | null>>
    setSeqNumber?: Dispatch<SetStateAction<number | null>>
    seqNumber?: number | null,
    type: string,
    setType: Dispatch<SetStateAction<string>>
}

const LessonPartForm: FC<args> =
    (
        {
            current,
            others,
            setChanges,
            setSeqNumber,
            seqNumber,
            type,
            setType,
            disableSetType
        }
    ) => {

        let prevSeqNumber = 0;

        if (!current && (!others || !setSeqNumber || seqNumber === undefined)) {
            throw new InvalidArgument("adding a lesson part", "needs all arguments")
        }

        const getName = (arg: displayableOutput) => {
            let final = "";

            if (arg.output.__typename === "ParagraphOutput") {
                if (arg.output.advancedText) {
                    final = "P:" + arg.output.advancedText
                } else {
                    final = "P:" + arg.output.basicText
                }
            } else if (arg.output.__typename === "EmbeddableOutput") {
                final = "E:" + arg.output.type
            } else {
                final = "Q:" + arg.output.question
            }

            if (final.length > 33) {
                return final.slice(0, 30) + "..."
            }
            return final
        }

        return (
            <>
                <h1>{current ? "Modifying" : "Adding"} a Lesson Part</h1>
                <hr/>
                {current ? "" :
                    <>
                        <p>Placement: </p>
                        {others ?
                            others.map((nav) => {
                                let targetValue = prevSeqNumber + ((nav.seqNumber - prevSeqNumber) / 2);
                                let x = (
                                    <div key={nav.seqNumber}>
                                        <button onClick={() => {
                                            setSeqNumber!(targetValue)
                                        }} disabled={targetValue === seqNumber}>Insert Here |
                                            SQNo: <i>{targetValue}</i>
                                        </button>
                                        <br/>
                                        <b>{getName(nav)}: {nav.id} | SQNo: <i>{nav.seqNumber}</i></b>
                                    </div>
                                )
                                prevSeqNumber = nav.seqNumber;
                                return x;
                            })
                            : ""
                        }
                        {others ?
                            <button onClick={() => {
                                setSeqNumber!(prevSeqNumber + 32)
                            }} disabled={(prevSeqNumber + 32) === seqNumber}>Insert Here |
                                SQNo: <i>{prevSeqNumber + 32}</i>
                            </button>
                            :
                            ""
                        }
                    </>
                }
                <hr/>
                <p>{disableSetType ? "" : "Select type"}</p>
                <button onClick={() => {
                    setType("PARAGRAPH")
                }} disabled={type === "PARAGRAPH" || disableSetType}>Paragraph
                </button>
                <button onClick={() => {
                    setType("Embeddable")
                }} disabled={type === "Embeddable" || disableSetType}>Embeddable
                </button>
                <button onClick={() => {
                    setType("QuizQuestion")
                }} disabled={type === "QuizQuestion" || disableSetType}>QuizQuestion
                </button>
                <hr/>
                {type === "PARAGRAPH" ?
                    <ParagraphInput setChanges={setChanges} current={current}/>
                    :
                    type === "QuizQuestion" ?
                        <QuizQuestionInput setChanges={setChanges} current={current}/>
                        :
                        <EmbeddableInput setChanges={setChanges} current={current}/>
                }
            </>
        )
    }

export default LessonPartForm