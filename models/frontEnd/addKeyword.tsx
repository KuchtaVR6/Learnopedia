import {Dispatch, FC, SetStateAction, useState} from "react";
import {BsFillPlusSquareFill} from "react-icons/bs";
import EvaluatorInput from "./evaluatorInput";

type args = {
    setAddedKeywords : Dispatch<SetStateAction<{ Score: number; word: string; }[]>>,
    addedKeywords : { Score: number; word: string; }[],
    keywords?: {ID: number, Score: number, word: string}[],
}

const AddKeyword : FC<args> = ({setAddedKeywords, addedKeywords, keywords}) => {
    const [currentScoreInput, setCSI] = useState<string>("")
    const [currentKeywordInput, setCKI] = useState<string>("")

    const [clearInput,setClearInput] = useState(false)

    const checkVacancy = (input : string) => {
        if(keywords) {
            for (let keyword of keywords)
            {
                if(keyword.word === input)
                {
                    return false
                }
            }
        }
        for(let keyword of addedKeywords)
        {
            if(keyword.word === input)
            {
                return false
            }
        }
        return true
    }

    const keywordEvaluator = (input : string) => {
        if(input.length>20)
        {
            throw new Error("Your keyword is too long 📏")
        }
        if(input.length<3)
        {
            throw new Error("Your keyword is too short 📏")
        }
        if(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ ]/g.test(input))
        {
            throw new Error("Your keyword contains special characters or spaces ⁉")
        }
        if(input.toLowerCase() !== input)
        {
            throw new Error("Your keyword must be all lower case letter 🔡")
        }
        if(!checkVacancy(input))
        {
            throw new Error("This keyword already exists ⚠")
        }
    }

    const keywordScoreEvaluator = (input : string) => {
        let score = parseFloat(input)
        if(score<1 || score>100)
        {
            throw new Error("Score must be <1,100> 󠀥󠀥%")
        }
        if(score%1!==0)
        {
            throw new Error("Score is not a natural number 🔢")
        }
    }

    return(
        <div>
            <h2>Add Keywords:</h2>
            <label>Word: &nbsp;</label><EvaluatorInput condition={keywordEvaluator} setInput={setCKI} placeholder={"word"} type={"text"} clear={clearInput}/>
            <label>Score: &nbsp;</label><EvaluatorInput condition={keywordScoreEvaluator} setInput={setCSI} placeholder={"score"} type={"number"} clear={clearInput}/>
            <button onClick={() => {setAddedKeywords([...addedKeywords, {Score : parseInt(currentScoreInput), word : currentKeywordInput}]); setClearInput(!clearInput)}} disabled={currentScoreInput && currentKeywordInput? false : true}><BsFillPlusSquareFill/> Add Keyword</button>
        </div>
    )
}

export default AddKeyword;