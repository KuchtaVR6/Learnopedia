import {FC} from "react";
import {AiTwotoneEdit} from "react-icons/ai";

type args = {
    loggedIn : boolean,
    label : string,
    path : string,
    removeText? : boolean,
}

const EditButton: FC<args> = ({loggedIn, label, path, removeText}) => {

    return (
        <div className={"buttonNiceContainer"} style={{float : "right", marginRight: "10px"}}>
            <a style={{opacity: loggedIn? "1" : "0.5"}} href={loggedIn? path : "/login?red="+path}>
                <>
                    <AiTwotoneEdit/> {removeText? "" : loggedIn? label : "Log in to edit"}
                </>
            </a>
        </div>

    )
}

export default EditButton;