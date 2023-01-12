import {createContext} from "react";
import {ApolloQueryResult, OperationVariables} from "@apollo/client";

export type userContextArgs = {
    loggedIn : () => boolean,
    logout: () => void,
    user: () => { nickname: string, email: string, lname : string, fname : string, XP : number, avatarPath : string, colorA : string, colorB : string } | undefined,
    request: ((variables?: Partial<OperationVariables> | undefined) => Promise<ApolloQueryResult<any>>) | undefined
    loading: () => boolean
}
export const UserContext = createContext<userContextArgs>(
    {
        loggedIn: () => false,
        logout: () => {},
        user: () => undefined,
        request: undefined,
        loading: () => false,
    }
);