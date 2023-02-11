import {FC, MutableRefObject, useEffect, useRef, useState} from "react";
import styles from "../../../styles/ContentDisplay.module.css"

type args = {
    uri: string
}

const NoStretchImage: FC<args> = ({uri}) => {

    const imageRef = useRef<HTMLImageElement>() as MutableRefObject<HTMLImageElement>
    const containerRef = useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>
    const [isCalculated, setIsCalculated] = useState(false)
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)

    const checkImage = () => {
        if (imageRef.current && containerRef.current) {
            let ratio = imageRef.current.naturalHeight/imageRef.current.naturalWidth ;
            let ratioContainer = containerRef.current.clientHeight/containerRef.current.clientWidth;
            if (ratioContainer > ratio) {
                setWidth(containerRef.current.clientWidth)
                setHeight((containerRef.current.clientWidth * imageRef.current.naturalHeight) / imageRef.current.naturalWidth)
            }
            else {
                setHeight(containerRef.current.clientHeight)
                setWidth((containerRef.current.clientHeight * imageRef.current.naturalWidth)/(imageRef.current.naturalHeight))
            }
            setIsCalculated(true)
        }
    }

    useEffect(() => {
        checkImage()
    }, [])
    return (
        <div className={styles.image} ref={containerRef} style={{width: "100%", height: isCalculated? "unset" : "35em"}}>
            <img
                onLoad={() => checkImage()}
                ref={imageRef}
                src={`${uri}`}
                style={{width: isCalculated? width : "unset", height: isCalculated? height : "unset"}}
                alt={`Image from ` + uri}
            />
        </div>
    )
}

export default NoStretchImage;