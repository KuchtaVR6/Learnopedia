import {NextPage} from "next";
import {FullOutput, MetaOutput} from "../../models/backEnd/contents/Content";
import RegularLayout from "../../models/frontEnd/regularLayout";
import styles from "../../styles/ContentDisplay.module.css";
import {useState} from "react";
import {useRouter} from "next/router";
import axios from "axios";
import SVGModifier from "../../models/frontEnd/inputs/svgModifier";

const ImageUpload: NextPage<{
    data: {
        mainMeta: MetaOutput,
        output: FullOutput
    }
}> = ({data}) => {

    const [imageSRC, setISRC] = useState("")
    const [error, setError] = useState<string>("")
    const [fileType, setFiletype] = useState<string>("")
    const [image, setImage] = useState<File | null>(null)
    const [isSVG, setIsSVG] = useState(false)
    const fileSizeLimit = 4 * 1024 * 1024;


    const changeImage = async (x: FileList) => {

        setIsSVG(false)

        const files = x
        setImage(null)

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
                setFiletype(extension)
                setISRC(URL.createObjectURL(theFile));
                setError("Press Save Changes to upload 👍")
                setImage(theFile)

                if (extension === "svg") {
                    setIsSVG(true);
                }
            }
        } else {
            setError(`Select a file smaller than ${fileSizeLimit / (1024 * 1024)}MB`)
        }

        if (x.length > 0) {
            setISRC(URL.createObjectURL(x[0]))
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
                {image? !isSVG? <img src={imageSRC} id="output" width="400"/> :
                    <SVGModifier inputFile={image} setFile={setImage}></SVGModifier> : ""}
                <hr/>
                <button onClick={upload} disabled={!image || waiting}>Submit the image</button>
            </div>
        </RegularLayout>
    )
}

export default ImageUpload;