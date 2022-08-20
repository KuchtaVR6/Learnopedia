import {ChangeEvent, Dispatch, FC, SetStateAction, useEffect, useRef} from "react";

type Args = {
    value?: string,
    readOnly?: boolean,
    size?: number,
    maxLength?: number,
    autoFocus?: boolean,
    className?: string,
    required?: boolean,
    autoComplete?: string,
    disabled?: boolean,
    placeholder?: string,
    type?: string,
    OnChange?: (e: ChangeEvent<HTMLInputElement>) => void

    evaluate: (newInput: string) => void,
    minLetters: number
    disableOnBlur?: boolean
    coolDown?: number
    setCurrentState?: Dispatch<SetStateAction<OSIStates>>
    basicValidator?: (arg: string) => boolean
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
                                   basicValidator
                               }) => {

    let intervals = 100;
    let minSpeed = 500;

    const timeRef = useRef(new Date())

    const speed = useRef(minSpeed)

    const initUse = useRef(true)

    const waits = useRef(0)

    const coolDownWaits = useRef(0)
    const coolDownRelease = useRef(false)

    const evaluateTime = useRef(false)

    const input = useRef("")
    const prevInput = useRef("")

    const sendEvaluation = () => {
        attemptToSetState(OSIStates.EVALUATING)
        prevInput.current = input.current
        evaluate(input.current);
    }

    const queueEval = () => {
        if (input.current !== prevInput.current) {
            if (!coolDown || initUse.current) {
                initUse.current = false
                sendEvaluation();
            } else {
                if (coolDownWaits.current > Math.ceil(coolDown / intervals) + 1) {
                    coolDownRelease.current = false;
                    sendEvaluation()
                    coolDownWaits.current = 0;
                } else {
                    attemptToSetState(OSIStates.ON_COOL_DOWN)
                    coolDownRelease.current = true;
                }
            }
        }
    }

    const timeout = useRef<any>(null)

    const attemptToSetState = (state: OSIStates) => {
        if (setCurrentState) {
            setCurrentState(state)
        }
    }

    useEffect(() => {
        clearInterval();
        timeout.current = setInterval(() => {
            if (evaluateTime.current) {
                waits.current += 1;
                if (waits.current === Math.ceil(speed.current * 5 / intervals) + 1) {
                    evaluateTime.current = false;
                    queueEval();
                    waits.current = 0;
                }
            }
            if (coolDown) {
                coolDownWaits.current += 1;
                if (coolDownRelease.current) {
                    if (coolDownWaits.current > Math.ceil(coolDown / intervals) + 1) {
                        coolDownRelease.current = false;
                        sendEvaluation();
                        coolDownWaits.current = 0;
                    }
                }
            }
        }, intervals, input)
    }, [])

    const change = (inputRegistered: string) => {
        if (inputRegistered.length < minLetters) {
            attemptToSetState(OSIStates.INSUFFICIENT_LETTERS)
            evaluateTime.current = false
            if (inputRegistered.length === 1) {
                timeRef.current = new Date();
            }
            input.current = ""
        } else {
            attemptToSetState(OSIStates.REGISTERING)
            if (inputRegistered.length === minLetters && speed.current === minSpeed) {
                let speedCalc = ((new Date()).getTime() - (timeRef.current).getTime()) / (minLetters - 1)
                if (speedCalc > minSpeed) {
                    speed.current = minSpeed;
                } else {
                    speed.current = speedCalc;
                }
            }
            if ((basicValidator && basicValidator(inputRegistered)) || !basicValidator) {
                evaluateTime.current = true
                input.current = inputRegistered
                waits.current = 0;
            } else {
                attemptToSetState(OSIStates.INVALID_INPUT)
            }
        }
    }

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


            onChange={(e) => {
                if (OnChange) {
                    OnChange(e)
                }
                change(e.target.value)
            }}
            onBlur={() => disableOnBlur ? "" : queueEval()}
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
}