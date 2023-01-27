import {FC, MutableRefObject, useEffect, useRef, useState} from "react";
import axios from "axios";
import styles from "../../../styles/Profile.module.css";
import {ImCross} from "react-icons/im";
import {MdModeEditOutline} from "react-icons/md";
import {useRouter} from "next/router";

type args = {
    enforceImage? : boolean
    imageName : string,
    fileSizeLimit: number
    hideOptions?: boolean
}

const ImageUploader: FC<args> = ({enforceImage, imageName, fileSizeLimit,hideOptions}) => {

    const [error, setError] = useState<string>("")
    const [imageSRC, setISRC] = useState("")
    const [editable, setEditable] = useState<boolean>(false)
    const inputRef = useRef<HTMLInputElement>(null) as MutableRefObject<HTMLInputElement>;

    const handler = async (formData: EventTarget & HTMLInputElement) => {

        const files = formData.files
        setImage(null)

        if (files && files.length > 0) {
            let theFile: File = files[0]
            if (theFile.size > fileSizeLimit)
            {
                setError(`🚛 File too large (${fileSizeLimit/(1024*1024)}MB limit)`)
                return;
            }
            else{
                if(enforceImage)
                {
                    let split = theFile.name.split(".")
                    let extension = split[split.length-1]
                    let allowedExtensions = ["apng","gif","ico","cur","jpg","jpeg","jfif","pjpeg","pjp","png","svg"]

                    if(allowedExtensions.indexOf(extension) < 0)
                    {
                        setError("🖼️ Unsupported type.")
                        return;
                    }
                }
                setISRC(URL.createObjectURL(theFile));
                setError("Press Save Changes to upload 👍")
                setImage(theFile)
            }
        }
        else{
            setError(`Select a file smaller than ${fileSizeLimit/(1024*1024)}MB`)
        }
    };

    useEffect(() => {
        inputRef.current.value = "";
        if (editable) {
            setError(`Select a file smaller than ${fileSizeLimit/(1024*1024)}MB`)
        }
        else{
            setError("")
        }
        setImage(null)
    }, [editable, fileSizeLimit])

    const [image, setImage] = useState<File | null>(null)
    const [waiting, setWaiting] = useState<boolean>(false)

    const router = useRouter();

    const upload = async () => {
        if (image) {
            const config = {
                headers: {'content-type': 'multipart/form-data'},
            };

            const formData = new FormData();

            formData.append(imageName.toLowerCase(), image);

            try{
                setError("Uploading...")
                setWaiting(true)
                const response = await axios.post('/api/upload/'+imageName.toLowerCase(), formData, config);


                if(response.data.success)
                {
                    setWaiting(false)
                    setError(imageName + " uploaded 😻")
                }
                else if (response.data.message === "Session has been invalidated.")
                {
                    await router.push("/login")
                }
                else
                {
                    setError("Unexpected error occurred 😿")
                }
            }
            catch {
                setError("Unexpected error occurred 😿")
            }
        }
    }

    return (
        <div style={{display: hideOptions? "none" : "inherit"}}>
            <div className={styles.userMod}>
                <div>
                    <div style={{display: "flex", flexDirection: "row"}}>
                        {imageName ? <label>{imageName}:&nbsp;</label> : ""}
                        <div>
                            <input ref={inputRef} accept="image/*" type="file" id="avatar" name="filename" onChange={(e) => {
                                handler(e.target)
                            }} disabled={!editable}/>
                            <div className={styles.waring}>{error}</div><br/>
                        </div>
                        <img src={imageSRC} width={100} />
                    </div>
                </div>

            </div>
            <div className={styles.userMod}>
                {hideOptions ? "" : editable ?
                    <button onClick={() => {
                        setEditable(false)
                    }}><ImCross/></button>
                    :
                    <button onClick={() => {
                        setEditable(true)
                    }}><MdModeEditOutline/></button>
                } &nbsp;

                <button onClick={upload} disabled={!image || waiting}>Submit {editable? "the" : "an"} image</button>
            </div>

        </div>

    )
}

export default ImageUploader