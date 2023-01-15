import {FC} from "react";
import styles from "../../../styles/ContentDisplay.module.css";

type args = {
    currents : {
        negatives : number,
        positives : number,
        max : number
    },
    cost : number,
    level : string
}

const VoteProgressDisplay : FC<args> = (args) => {
    let properMax : number;

    if(args.currents.max>args.cost)
    {
        properMax = args.cost
    }
    else{
        properMax = args.currents.max
    }

    const calcPercentage = (val : number) => {
        let simple = (val/properMax)*100
        if(simple > 100)
            return 100
        if(simple < 0)
            return 0
        return Math.round(simple)
    }

    return (
        <>
            <b>{args.level} level support</b>
            <br/>
            Applying is at {calcPercentage(args.currents.positives)}%
            <div className={styles.progressBarParent}>
                <div style={{width: `${calcPercentage(args.currents.positives)}%`}}>
                </div>
            </div>
            Veto is at {calcPercentage(args.currents.negatives)}%
            <div className={styles.progressBarParent}>
                <div style={{width: `${calcPercentage(args.currents.negatives)}%`, backgroundColor: "red"}}>
                </div>
            </div>
        </>
    )
}

export default VoteProgressDisplay;