import {FC} from "react";
import styles from "../../../styles/ContentDisplay.module.css";

type args = {
    xp : number,

}

const XpBar : FC<args> = ({xp}) => {

    let level = -1;
    if(xp!==0) {
        level = Math.floor(Math.log2(xp));
    }
    let neededXP = Math.pow(2, level+1)

    const calcPercent = () => {
        if(xp==0)
        {
            return 0
        }
        return 100 - ((neededXP-xp)/(neededXP))*200
    }

    return(
        <div className={styles.center}>
            <h2>Level {level+1}</h2>
            <b>Current: {xp} XP</b> <i>| Next Level at: {neededXP} XP</i>
            <div className={styles.progressBarParent}>
                <div style={{width: `${calcPercent()}%`}}>
                </div>
            </div>
            {Math.floor(calcPercent())}%
        </div>
    )
}

export default XpBar;