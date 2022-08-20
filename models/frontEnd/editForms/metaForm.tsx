import {Dispatch, FC, SetStateAction, useEffect, useState} from "react";
import {MetaOutput} from "../../backEnd/contents/Content";
import styles from "../../../styles/ContentDisplay.module.css";
import {AiFillDelete} from "react-icons/ai";
import AddKeyword from "../keywordCompoments/addKeyword";
import EvaluatorInput from "../inputs/evaluatorInput";
import {MetaChanges} from "../../../pages/edit/add/[targetid]";
import {element} from "prop-types";

type args = {
    type: number,
    setOutput: Dispatch<SetStateAction<MetaChanges>>
    main?: MetaOutput
    parentTitle?: string
    navigation?: MetaOutput[]
}

const MetaForm: FC<args> = ({type, main, parentTitle, navigation, setOutput}) => {

    if (type !== 0 && !navigation && !main) {
        throw new Error("Non-course addition must have navigation")
    }

    let prevSeqNumber = 0;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("")
    const [seqNumber, setSeqNumber] = useState<number>(main ? main.seqNumber : -1)

    const [addedKeywords, setAddedKeywords] = useState<{ Score: number, word: string }[]>([])
    const [deletedKeywords, setRemoveKeywords] = useState<number[]>([])

    useEffect(() => {
        if(!main){
            setOutput({
                title: title.length > 0 ? title : null,
                description: description.length > 0 ? description : null,
                addedKeywords: addedKeywords.length > 0 ? addedKeywords : null,
                deletedKeywords: deletedKeywords.length > 0 ? deletedKeywords : null,
                seqNumber: seqNumber >= 0? seqNumber : null
            })
        }
        else{
            setOutput({
                title: title.length > 0 && title !== main.name ? title : null,
                description: description.length > 0 && description !== main.description? description : null,
                addedKeywords: addedKeywords.length > 0 ? addedKeywords : null,
                deletedKeywords: deletedKeywords.length > 0 ? deletedKeywords : null,
                seqNumber: null
            })
        }
    }, [title, description, seqNumber, addedKeywords, deletedKeywords])

    const titleEvaluator = (input: string) => {
        if (input.length > 80) {
            throw new Error("Your title is too long 📏 (max 80 chars)")
        }
        if (input.length < 10) {
            throw new Error("Your title is too short 📏 (min 10 chars)")
        }
    }

    const descriptionEvaluator = (input: string) => {
        if (input.length > 160) {
            throw new Error("Your description is too long 📏 (max 160 chars)")
        }
        if (input.length < 50) {
            throw new Error("Your description is too short 📏 (min 50 chars)")
        }
    }

    return (
        <div>
            {parentTitle ? <h1>Adding a {type == 1 ? "Chapter" : "Lesson"} to {parentTitle}</h1> : main ?
                <h1>Modifying {main.name}</h1> : <h1>Creating a new Course</h1>}
            <hr/>
            <h2>Basic Details</h2>
            Title: <br/>
            <EvaluatorInput textarea={{rows: 2, columns: 50}} setInput={setTitle} condition={titleEvaluator}
                            value={main ? main.name : ""}/>
            Description: <br/>
            <EvaluatorInput textarea={{rows: 5, columns: 50}} value={main ? main.description : ""}
                            condition={descriptionEvaluator} setInput={setDescription}/>
            <hr/>
            <h2>Current Keywords:</h2>
            {main ? main.keywords.map((keyword) => {
                let index = deletedKeywords.indexOf(keyword.ID)
                if (index < 0) {
                    return <button
                        onClick={
                            (e) => {
                                setRemoveKeywords([...deletedKeywords, keyword.ID])
                            }}
                        key={keyword.ID}
                        className={styles.keyword}>
                        <AiFillDelete/>
                        {keyword.word + " >>> " + keyword.Score}%
                    </button>
                } else {
                    return <button
                        key={keyword.ID}
                        style = {{textDecoration: "line-through",opacity: "80%"}}
                        className={styles.keyword}
                        onClick={
                            (e) =>
                            {
                                setRemoveKeywords([...deletedKeywords.filter((element) => {
                                    return element !== keyword.ID;
                                })])
                            }
                        }
                    >
                        <AiFillDelete/>
                        {keyword.word + " >>> " + keyword.Score}%
                    </button>
                }
            }) : ""}
            {
                addedKeywords.map((keyword, key) => {
                    return <button
                        onClick={
                            (e) => {
                                setAddedKeywords(addedKeywords.filter(((valueMap, index) => {
                                    if (index == key) {
                                        return false;
                                    }
                                    return true
                                })))
                            }}
                        key={key}
                        className={styles.keyword}>
                        <AiFillDelete/>
                        <i>{keyword.word + " >>> " + keyword.Score}%</i>
                    </button>
                })
            }
            <hr/>
            <AddKeyword setAddedKeywords={setAddedKeywords} addedKeywords={addedKeywords}/>
            <hr/>
            <h2>{main ? "Placement can be changed by modifying the list of the parent." : type !== 0 ? "Placement:" : "Courses have no placement"}</h2>
            {navigation ?
                navigation.map((nav) => {
                    let targetValue = prevSeqNumber + ((nav.seqNumber - prevSeqNumber) / 2);
                    let x = (
                        <div key={nav.seqNumber}>
                            <button onClick={(e) => {
                                setSeqNumber(targetValue)
                            }} disabled={targetValue === seqNumber ? true : false}>Insert Here |
                                SQNo: <i>{targetValue}</i>
                            </button>
                            <br/>
                            <b>{nav.name} | SQNo: <i>{nav.seqNumber}</i></b>
                        </div>
                    )
                    prevSeqNumber = nav.seqNumber;
                    return x;
                })
                :
                ""
            }
            {type !== 0 ?
                <button onClick={() => {
                    setSeqNumber(prevSeqNumber + 32)
                }} disabled={(prevSeqNumber + 32) === seqNumber ? true : false}>Insert Here |
                    SQNo: <i>{prevSeqNumber + 32}</i>
                </button>
                : ""}
        </div>
    )
}

export default MetaForm;