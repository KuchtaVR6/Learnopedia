import {FC, useEffect, useRef} from "react";
import {DocumentNode, gql, useMutation} from "@apollo/client";
import {useRouter} from "next/router";

export type AuthenticatorArgs = {
    method: DocumentNode,
    args: any,
    next: string
    buttonName?: string
    instantTrigger?: boolean
    onErrorTrigger?: (e : Error) => void
    disable?: boolean
}

export const accessTokenRequest: DocumentNode = gql`
    mutation Mutation{
        requestAccessToken {
            authorisation
        }
    }
`

/**
 * Authenticator - FC for handling requests for authentication, will make sure that both
 * refresh token and the access token is received on authentication.
 *
 * @param method - the main request method in gql format, must grant a requestToken or fail!
 * method will be called on submit with:
 * @param args - arguments for the request in a mapping key to value, in a JSON.
 * @param next - url of the page that the user will be forwarded to
 * @param buttonName - a name given to the submit button (OPTIONAL)
 * @param instantTrigger - if you want to skip creating the button an instantly trigger set this to true (OPTIONAL) (will only fetch once)
 * @param onErrorTrigger - function that will be called in case of an error
 * @param disable - disable the button (OPTION) - true - disabled, false/unset - enabled
 */

const Authenticator: FC<AuthenticatorArgs> = ({
                                                  method,
                                                  args,
                                                  next,
                                                  buttonName,
                                                  instantTrigger,
                                                  onErrorTrigger,
                                                  disable
                                              }) => {

    //router to redirect the user
    const router = useRouter();

    //hook for the mainRequest provided by user
    const [mainRequest, {loading, error, data}] = useMutation(method);

    //hook for the accessToken request
    const [atRequest] = useMutation(accessTokenRequest)

    const firstFetch = useRef(true)

    //trigger the main request
    function trigger() {
        //calls the mainRequest with variables decoded from the map.
        mainRequest({variables: args})
            .catch((e : Error) => {
                if (onErrorTrigger) {
                    onErrorTrigger(e)
                }
                //the error is already being printed using error
            })
    }

    useEffect(() => {
        if (data) {

            window.sessionStorage.setItem("loggedIn", "true")
            //on success fetch the accessToken
            atRequest().then(() => {
                //on success redirect to next
                if (router.route === "/" + next) {
                    router.reload()
                } else {
                    router.push(next)
                }
            }).catch(() => {
                /**
                 * atRequest fail can only happen if:
                 * 1. a refresh token invalidation has been triggered
                 * (which means there was a very fast attack, because
                 * the request token has just been created and received)
                 *
                 * 2. internal server error
                 *
                 * In both cases the previous action has been done so
                 * the user will be proceeded to the login page to
                 * authenticate again.
                 */
                router.push("/login?concern=true")
            })
        }

    }, [atRequest, data, next, router])

    useEffect(() => {
        if (firstFetch.current) {
            if (instantTrigger) {
                firstFetch.current = false
                trigger()
            }
        }
    }, [instantTrigger])

    //whilst waiting display loading
    if (loading) {
        return (
            <>
                Loading...
            </>
        )
    }

    if (!instantTrigger) {
        return (
            <>
                <button disabled={disable || loading}
                        onClick={trigger}>{loading ? "Loading..." : buttonName ? buttonName : "Submit"}</button>
                {error?.message}
            </>
        )
    }
    return (
        <h1>
            Checking... 🤖
        </h1>
    )
}

export default Authenticator;