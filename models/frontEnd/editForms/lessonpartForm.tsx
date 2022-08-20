import {Dispatch, FC, SetStateAction, useState} from "react";
import {displayableOutput} from "../../backEnd/lessonParts/LessonPart";
import {LessonPartInputs} from "../../backEnd/lessonParts/LessonPartManager";
import {InvalidArgument} from "../../backEnd/tools/Errors";
import ParagraphInput from "../lessonPartsInput/ParagraphInput";

type args = {
    current?: displayableOutput
    others?: displayableOutput[]
    setChanges: Dispatch<SetStateAction<LessonPartInputs | null>>
    setSeqNumber?: Dispatch<SetStateAction<number | null>>
    seqNumber?: number | null,
    type : string,
    setType : Dispatch<SetStateAction<string>>
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
            setType
        }
        ) => {

    let prevSeqNumber = 0;

    if (!current && (!others || !setSeqNumber || seqNumber===undefined)) {
        throw new InvalidArgument("adding a lesson part", "needs all arguments")
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
                                    <button onClick={(e) => {
                                        setSeqNumber!(targetValue)
                                    }} disabled={targetValue === seqNumber ? true : false}>Insert Here |
                                        SQNo: <i>{targetValue}</i>
                                    </button>
                                    <br/>
                                    <b>Existing Part: {nav.id} | SQNo: <i>{nav.seqNumber}</i></b>
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
                        }} disabled={(prevSeqNumber + 32) === seqNumber ? true : false}>Insert Here |
                            SQNo: <i>{prevSeqNumber + 32}</i>
                        </button>
                        :
                        ""
                    }
                </>
            }
            <hr/>
            <p>Select type:</p>
            <button onClick={() => {setType("PARAGRAPH")}} disabled={type==="PARAGRAPH"}>Paragraph</button> More coming soon!
            <hr/>
            {type==="PARAGRAPH"?
                <ParagraphInput setChanges={setChanges} current={current}/>
                :
                "Coming soon"
            }
        </>
    )
}

export default LessonPartForm