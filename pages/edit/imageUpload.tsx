import {NextPage} from "next";
import RegularLayout from "../../models/frontEnd/regularLayout";
import styles from "../../styles/ContentDisplay.module.css";
import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/router";
import axios from "axios";
import SVGModifier from "../../models/frontEnd/inputs/svgModifier";
import {BiDownload, BiRedo, BiUndo} from "react-icons/bi";

const ImageUpload: NextPage = () => {

    const [imageSRC, setImageSRC] = useState("")
    const [error, setError] = useState<string>("")

    const previousImages = useRef<File[]>([])
    const currentIndex = useRef<number>(-1)

    const [redoUndo, setRedoUndo] = useState<{ undo: boolean, redo: boolean }>({undo: false, redo: false})

    const [image, setInnerImage] = useState<File | null>(null)
    const [isSVG, setIsSVG] = useState(false)
    const fileSizeLimit = 4 * 1024 * 1024;

    const addImage = (file: File | null) => {
        setInnerImage(file);

        if (file) {
            currentIndex.current += 1;
            if (currentIndex.current >= previousImages.current.length) {
                previousImages.current = [...previousImages.current, file]
            } else {
                /** deleted all the overwritten files */
                previousImages.current = [...previousImages.current.slice(0, currentIndex.current - 1), file]
            }
            changeUndoRedo();
        }
    }

    const changeUndoRedo = () => {
        setRedoUndo(
            {
                redo: currentIndex.current < previousImages.current.length - 1,
                undo: currentIndex.current > 0
            })
    }

    const undo = () => {
        if (currentIndex.current > 0) {
            currentIndex.current -= 1
            setInnerImage(previousImages.current[currentIndex.current])
            changeUndoRedo();
        }
    }

    const redo = () => {
        if (currentIndex.current < previousImages.current.length - 1) {
            currentIndex.current += 1
            setInnerImage(previousImages.current[currentIndex.current])
            changeUndoRedo();
        }
    }

    const download = () => {
        if (image) {
            const link = document.createElement("a");

            // Set link's href to point to the Blob URL
            link.href = URL.createObjectURL(image);

            let split = image.name.split(".")
            let extension = split[split.length - 1]

            link.download = "output." + extension;

            // Append link to the body
            document.body.appendChild(link);

            // Dispatch click event on the link
            // This is necessary as link.click() does not work on the latest firefox
            link.dispatchEvent(
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                })
            );

            // Remove link from body
            document.body.removeChild(link);
        }
    }

    useEffect(() => {
        if (image) {
            let split = image.name.split(".")
            let extension = split[split.length - 1]
            setImageSRC(URL.createObjectURL(image))

            setIsSVG(extension === "svg");
        } else {
            setImageSRC("")
        }
    }, [image])

    const changeImage = async (x: FileList) => {

        setIsSVG(false)

        const files = x
        addImage(null)

        if (files && files.length > 0) {
            let theFile: File = files[0]
            if (theFile.size > fileSizeLimit) {
                setError(`🚛 File too large (${fileSizeLimit / (1024 * 1024)}MB limit)`)
                return;
            } else {
                let split = theFile.name.split(".")
                let extension = split[split.length - 1]
                let allowedExtensions = ["apng", "gif", "ico", "cur", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "svg"]

                if (allowedExtensions.indexOf(extension) < 0) {
                    setError("🖼️ Unsupported type.")
                    return;
                }
                setImageSRC(URL.createObjectURL(theFile));
                setError("Press Submit the Image to upload 👍")
                addImage(theFile)

                if (extension === "svg") {
                    setIsSVG(true);
                }
            }
        } else {
            setError(`Select a file smaller than ${fileSizeLimit / (1024 * 1024)}MB`)
        }

        if (x.length > 0) {
            setImageSRC(URL.createObjectURL(x[0]))
        }
    }

    const [waiting, setWaiting] = useState<boolean>(false)

    const router = useRouter();

    let imageName = "content";

    const upload = async () => {
        if (image) {
            const config = {
                headers: {'content-type': 'multipart/form-data'},
            };

            const formData = new FormData();

            formData.append(imageName.toLowerCase(), image);

            try {
                setError("Uploading...")
                setWaiting(true)
                const response = await axios.post('/api/upload/' + imageName.toLowerCase(), formData, config);

                if (response.data.success) {
                    setWaiting(false)
                    setError(imageName + " uploaded 😻")
                } else if (response.data.message === "Session has been invalidated.") {
                    await router.push("/login")
                } else {
                    setError("Unexpected error occurred 😿")
                }
            } catch {
                setError("Unexpected error occurred 😿")
            }
        }
    }

    return (
        <RegularLayout enforceUser={true}>
            <div className={styles.main}>
                <h1>Upload images for your courses.</h1>
                <hr/>
                <h2>Regulations around image hosting</h2>
                <p>
                    Learnopedia is <b>not</b> a image hosting service. As such we have the following measures
                    implemented:<br/>
                    1. Any images can be deleted without prior warning in the following circumstances:<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a. Violation of Learnopedia Terms and Conditions<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;b. Strong belief that the image has been uploaded for purposes
                    other than
                    improving/creating the content on Learnopedia<br/>
                    2. Each user can host at most 1 image that is not within any active* content, active* content
                    proposal or active* content edit proposal. Every new image will overwrite the old one.<br/>
                    3. Each user can host at most 5 images that are not within with any active* content, but are within
                    a active* content proposal or active* content edit proposal. Every image above the 5 threshold will
                    overwrite the oldest image.<br/>
                    4. All files uploaded here must be no larger than 4MB and conform to one of these types: apng, gif,
                    ico, cur, jpg, jpeg, jfif, pjpeg, pjp, png, svg
                    *active - has not been vetoed / deleted<br/>
                    <b>There is no limit to the number of purposeful images you upload to the platform that become parts
                        of meaningful courses.</b><br/>
                    These measures are to ensure fairness, availability and reliability of our image hosting feature.
                </p>
                <hr/>
                <input type="file" id="image" accept="image/*" name="filename" onChange={(e) => {
                    if (e.target.files) changeImage(e.target.files)
                }}/>
                <div className={styles.waring}>{error}</div>
                <br/>
                <hr/>
                {image ? !isSVG ?
                    <img alt="preview of your image" src={imageSRC} id="output" width="400"/> :
                    <SVGModifier inputFile={image} setFile={addImage}></SVGModifier> : ""}
                <hr/>
                <button disabled={!redoUndo.undo} onClick={undo}><BiUndo/> undo</button>
                <button disabled={!redoUndo.redo} onClick={redo}><BiRedo/> undo</button>
                <button disabled={!image} onClick={download}>
                    <BiDownload/>
                    download
                </button>
                <hr/>
                <button onClick={upload} disabled={!image || waiting}>Submit the image</button>
            </div>
        </RegularLayout>
    )
}

export default ImageUpload;