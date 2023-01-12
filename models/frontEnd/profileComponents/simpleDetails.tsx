import {FC, useEffect, useState} from "react";
import {gql, useMutation} from "@apollo/client";
import styles from "/styles/Profile.module.css";
import ModifyDisplayConstrained, {ConstrainedInputTypes} from "../inputs/modifyDisplayConstrained";
import ModifyDisplay from "../inputs/modifyDisplay";
import ImageUploader from "../inputs/imageUploader";
import ColorInput from "../inputs/colorInput";

type args = {
    data: any,
    loading: boolean
    hideOptions?: boolean
}

const SimpleDetails: FC<args> = ({data, loading, hideOptions}) => {

    const modUser = gql`
        mutation Mutation($lname: String, $fname: String, $nickname: String, $colorA : String, $colorB : String) {
            modifyUser(lname: $lname, fname: $fname, nickname: $nickname, colorA: $colorA, colorB: $colorB) {
                nickname
            }
        }
    `

    const [sendSimpleMod] = useMutation(modUser)

    const [nickname, setNickname] = useState("")
    const [fname, setFName] = useState("")
    const [lname, setLName] = useState("")
    const [colorA, setColorA] = useState<string>("")
    const [colorB, setColorB] = useState<string>("")

    const [displayNick, setDisplayNick] = useState(data.nickname)
    const [displayFName, setDisplayFName] = useState(data.fname)
    const [displayLName, setDisplayLName] = useState(data.lname)

    const [simpleChanges, setSimpleChanges] = useState(false)

    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        if (nickname || fname || lname || colorA || colorB) {
            if (data) {
                if ((nickname && nickname !== data.nickname) || (fname && fname !== data.fname) || (lname && lname !== data.lname) || (colorA !== data.colorA) || (colorB !== data.colorB)) {
                    setSimpleChanges(true)
                    return
                }
            }
        }
        setSimpleChanges(false)
    }, [nickname, fname, lname, colorA, colorB, data])

    const simpleMod = () => {
        setSimpleChanges(false)
        setUpdating(true)
        let vars: any = {};
        if (nickname && nickname !== data.nickname) {
            vars["nickname"] = nickname;
        }
        if (fname && fname !== data.fname) {
            vars["fname"] = fname;
        }
        if (lname && lname !== data.lname) {
            vars["lname"] = lname;
        }
        if (colorA && colorA !== data.colorA) {
            vars["colorA"] = colorA
        }
        if (colorB && colorB !== data.colorB) {
            vars["colorB"] = colorB
        }

        sendSimpleMod({
            variables: vars
        }).then(() => {
            if (nickname) {
                setDisplayNick(nickname)
            }
            if (lname) {
                setDisplayLName(lname)
            }
            if (fname) {
                setDisplayFName(fname)
            }
            setUpdating(false)
        })
    }

    //updating is for simple re-rendering
    return (
        <>
            <div className={styles.zone}>
                <div className={styles.details}>
                    {updating ?
                        <h1> Updating... </h1>
                        :
                        <>
                            <ModifyDisplayConstrained desc={"Username: "} value={displayNick}
                                                      setProp={setNickname}
                                                      type={ConstrainedInputTypes.NICKNAME}
                                                      hideOptions={hideOptions}
                            />
                            <ModifyDisplay desc={"Forename: "} value={displayFName} setProp={setFName}
                                           hideOption={hideOptions}/>
                            <ModifyDisplay desc={"Surname: "} value={displayLName} setProp={setLName}
                                           hideOption={hideOptions}/>
                            <ColorInput value={data.colorA.toLowerCase()} setProp={setColorA} desc={"Left Gradient colour: "}
                                        hideOption={hideOptions}/>
                            <ColorInput value={data.colorB.toLowerCase()} setProp={setColorB} desc={"Right Gradient colour: "}
                                        hideOption={hideOptions}/>

                        </>
                    }
                </div>
                {hideOptions ? "" : <button disabled={(!simpleChanges || loading)} onClick={() => simpleMod()}
                                            className={styles.save}>{loading ? "Loading..." : simpleChanges ? "Save the changes" : "No changes"}</button>}
            </div>
            <div className={styles.zone}>
                <ImageUploader imageName={"Avatar"} enforceImage={true} fileSizeLimit={2 * 1024 * 1024}
                               hideOptions={hideOptions}/>
            </div>

        </>
    )
}

export default SimpleDetails;