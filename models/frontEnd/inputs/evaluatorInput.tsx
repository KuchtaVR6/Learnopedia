import {Dispatch, FC, SetStateAction, useEffect, useState} from "react";

type args = {
    condition : (input : string) => void
    setInput : Dispatch<SetStateAction<string>>
    width? : number
    type? : string,
    placeholder? : string,
    clear? : boolean,
    value?: string
    textarea? : {
        rows: number,
        columns : number
    }
}

const EvaluatorInput : FC<args> = ({condition, setInput, width, type, placeholder, clear,value, textarea}) => {

    const [error, setError] = useState("")

    const [displayedValue, setDisplayedValue] = useState(value)

    useEffect(() => {
        if (clear !== undefined) {
            setInput(value? value : "")
            setDisplayedValue(value? value : "")
        }
    },[clear, setInput])

    if(!textarea) {
        return (
            <>
                <input
                    type={type}
                    placeholder={placeholder}
                    size={width}
                    value={displayedValue}
                    onChange={(e) => {
                        setDisplayedValue(e.target.value)
                        try {
                            condition(e.target.value)
                            setInput(e.target.value)
                            setError("")
                        } catch (thisError: any) {
                            setError(thisError.toString().slice(7))
                            setInput("")
                        }
                    }}

                >
                </input><br/>
                {error}
                <br/>
            </>
        )
    }
    return (
        <>
            <textarea
                placeholder={placeholder}
                value={displayedValue}
                rows={textarea.rows}
                cols={textarea.columns}
                onChange={(e) => {
                    setDisplayedValue(e.target.value)
                    try {
                        condition(e.target.value)
                        setInput(e.target.value)
                        setError("")
                    } catch (thisError: any) {
                        setError(thisError.toString().slice(7))
                        setInput("")
                    }
                }}
            >
            </textarea> <br/>
            {error}
            <br/>
        </>
    )
}

export default EvaluatorInput;