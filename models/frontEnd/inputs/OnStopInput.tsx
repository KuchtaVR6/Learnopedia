import {ChangeEvent, FC, MutableRefObject, useRef, useState} from "react";

type Args = {
    value?: string,
    readOnly?: boolean,
    size?: number,
    maxLength?: number,
    autoFocus?: boolean,
    name? : string,
    className?: string,
    required?: boolean,
    autoComplete?: string,
    disabled?: boolean,
    placeholder?: string,
    type?: string,
    OnChange?: ( e: ChangeEvent<HTMLInputElement> ) => void

    // when the input is ready ask the parent to send an actual request
    evaluate: (newInput: string, ver : number) => void,

    // minimal number of letters for the input
    minLetters: number

    // if true in will not perform check after blur
    disableOnBlur?: boolean

    // coolDown in ms
    coolDown: number

    // tell the parent about status
    setCurrentState?:  (inputRegistered: OSIStates, ver: number) => void

    // basic boolean check of validity
    basicValidator?: ( arg: string ) => boolean

    prevState : MutableRefObject<string>
}

const OnStopInput: FC<Args> = ({
                                   value,
                                   readOnly,
                                   size,
                                   maxLength,
                                   autoFocus,
                                   className,
                                   required,
                                   placeholder,
                                   autoComplete,
                                   disabled,
                                   type,
                                   OnChange,
                                   evaluate,
                                   minLetters,
                                   disableOnBlur,
                                   coolDown,
                                   setCurrentState,
                                   basicValidator,
                                   prevState,
                                   name
                               }) => {

    let minSpeed = 500;

    const timeRef = useRef(new Date())

    const speed = useRef(minSpeed)

    const sendEvaluation = (inputRegistered : string, ver : number) => {
        if (ver)
        {
            if (ver > verMax.current)
            {
                verMax.current = ver
            }
            else if (ver < verMax.current)
            {
                // stale request, will be ignored
                return;
            }
        }
        attemptToSetState(OSIStates.EVALUATING, ver)
        evaluate(inputRegistered, ver);
    }

    const attemptToSetState = (state: OSIStates, ver : number) => {
        if (ver)
        {
            if (ver > verMax.current)
            {
                verMax.current = ver
            }
            else if (ver < verMax.current)
            {
                // stale request, will be ignored
                return;
            }
        }
        if (setCurrentState) {
            setCurrentState(state, ver)
        }
    }

    let queueTimeout : MutableRefObject< NodeJS.Timeout > = useRef(setTimeout(()=>{},0));

    // happens on each character
    const listen = (inputRegistered : string) => {
        verMax.current += 1;
        let thisVer = verMax.current;
        if (inputRegistered.length < minLetters) {
            attemptToSetState(OSIStates.INSUFFICIENT_LETTERS, thisVer)
            if (inputRegistered.length === 1) {
                // records the time the first letter was read
                timeRef.current = new Date();
            }
        }
        else {
            if (inputRegistered.length === minLetters && speed.current === minSpeed) {
                // calculates the speed of the user
                let speedCalc = ((new Date()).getTime() - (timeRef.current).getTime()) / (minLetters - 1)
                if (speedCalc > minSpeed) {
                    speed.current = minSpeed;
                } else {
                    speed.current = speedCalc;
                }
            }
            if ((basicValidator && basicValidator(inputRegistered)) || !basicValidator) {
                attemptToSetState(OSIStates.REGISTERING,thisVer)
                // enqueue as this might be potentially the end of the input

                clearTimeout(queueTimeout.current)
                queueTimeout.current = setTimeout(() => {dispatchForCooling(inputRegistered, this)}, Math.ceil(speed.current * 5 ) + 1)
            } else {
                // if the basic check fails let the superclass know
                attemptToSetState(OSIStates.INVALID_INPUT, thisVer)
            }
        }
    }

    // no request until the Expiry
    let coolDownExpiry = useRef(new Date())
    let coolDownTimeout : MutableRefObject< NodeJS.Timeout > = useRef(setTimeout(()=>{},0));

    // keep track of the newest version of query incoming
    let verMax = useRef(0);

    // when user (potentially) has finished typing or on Blur
    const dispatchForCooling = (inputRegistered : string, ver? : number) =>
    {
        if(prevState.current !== inputRegistered) {
            if (ver) {
                if (ver > verMax.current) {
                    verMax.current = ver
                } else if (ver < verMax.current) {
                    // stale request, will be ignored
                    return;
                }
            }
            // since the user might have entered here using on blur new ver number is need
            verMax.current += 1;
            let thisVer = verMax.current;
            if (inputRegistered.length < minLetters) {
                attemptToSetState(OSIStates.INSUFFICIENT_LETTERS, thisVer)
            } else {
                if ((basicValidator && basicValidator(inputRegistered)) || !basicValidator) {
                    attemptToSetState(OSIStates.ON_COOL_DOWN, thisVer)

                    clearTimeout(coolDownTimeout.current)

                    if (new Date() > coolDownExpiry.current) {
                        postCoolDown(inputRegistered, thisVer)
                    } else {
                        let delay = coolDownExpiry.current.getTime() - new Date().getTime()
                        coolDownTimeout.current = setTimeout(() => {
                            postCoolDown(inputRegistered, thisVer)
                        }, delay)
                    }

                } else {
                    // if the basic check fails let the superclass know
                    attemptToSetState(OSIStates.INVALID_INPUT, thisVer)
                }
            }
        }
    }

    const postCoolDown = (inputRegistered : string, ver : number) => {
        if (ver)
        {
            if (ver > verMax.current)
            {
                verMax.current = ver
            }
            else if (ver < verMax.current)
            {
                // stale request, will be ignored
                return;
            }
        }
        coolDownExpiry.current = new Date(new Date().getTime() + coolDown)

        sendEvaluation(inputRegistered, ver)
    }

    const [inputContents, setInputContents] = useState("");

    return (
        <input
            className={className === undefined ? "" : className}
            required={required}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            type={type}
            value={value}
            readOnly={readOnly}
            size={size}
            maxLength={maxLength}
            autoFocus={autoFocus}
            name = {name}
            id = {name}


            onChange={(e) => {
                if (OnChange) {
                    OnChange(e)
                }
                listen(e.target.value)
                setInputContents(e.target.value)
            }}
            onBlur={() => disableOnBlur ? "" : dispatchForCooling(inputContents, 0)}
        />
    )

}

export default OnStopInput;

export enum OSIStates {
    INSUFFICIENT_LETTERS,
    REGISTERING,
    INVALID_INPUT,
    EVALUATING,
    ON_COOL_DOWN,
    TAKEN,
    ACCEPTED
}