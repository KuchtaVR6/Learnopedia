import {AmendmentOutput, VotingSupport} from "../backEnd/amendments/Amendment";
import {FC, useContext, useEffect, useState} from "react";
import SingularAmendment from "./contentDisplays/singularAmendment";
import {gql, useLazyQuery, useQuery} from "@apollo/client";
import {UserContext} from "./authentication/userContext";

type args = {
    input: AmendmentOutput[]
}

const AmendmentDisplay: FC<args> = ({input}) => {

    let x = 0;

    const [numberUnapproved, setNumberUnapproved] = useState(0)
    const [numberVetoed, setNumberVetoed] = useState(0)

    const [fetchedVotingData, setFetchedVotingData] = useState<Map<number,VotingSupport> | undefined>(undefined)

    const [fetch, {data, loading, error}] = useLazyQuery(gql`
        query CheckAmendmentVotes($amendmentIds: [Int!]!) {
            checkAmendmentVotes(amendmentIds: $amendmentIds) {
                individualSupports {
                    max
                    negatives
                    positives
                }
                amendmentID
                userOP
            }
        }
    `)

    useEffect(() => {
        let array : number[] = new Array();
        input.map((amend) => {
            if (amend.applied === false && amend.vetoed===false && amend.id) {
                array.push(amend.id);
            }
        })
        if(window.sessionStorage.getItem("loggedIn")==="true" && array.length>0)
        {
            fetch({variables : { amendmentIds : array}})
        }
        setNumberUnapproved(array.length)
        let array2 : number[] = new Array();
        input.map((amend) => {
            if (amend.vetoed === true && amend.id) {
                array2.push(amend.id);
            }
        })
        setNumberVetoed(array2.length)
    }, [])

    useEffect(() => {
        if(data) {
            let map = new Map<number, VotingSupport>()

            data.checkAmendmentVotes.map((amend : VotingSupport) => {
                map.set(amend.amendmentID, amend)
            })

            setFetchedVotingData(map)
        }
    },[data])

    if (input.length > 0) {
        return (
            <div>
                <hr/>
                <h3 style={{display: numberUnapproved===0? "none" : "inherit"}}>Amendments that are awaiting approval:</h3>
                {
                    input.map((row) => {
                        if (row.applied === false && row.vetoed === false) {
                            x += 1;
                            return (
                                <SingularAmendment row={row} key={x} disableVotes={loading} voteOutputMap={fetchedVotingData}/>
                            )
                        }
                    })
                }
                <h3>Amendments applied:</h3>
                {
                    input.map((row) => {
                        if (row.applied === true && row.vetoed === false) {
                            x += 1;
                            return (
                                <SingularAmendment row={row} key={x} disableVotes={loading} voteOutputMap={fetchedVotingData}/>
                            )
                        }
                    })
                }
                <h3 style={{display: numberVetoed===0? "none" : "inherit"}}>Amendments that have been vetoed:</h3>
                {
                    input.map((row) => {
                        if (row.vetoed === true) {
                            x += 1;
                            return (
                                <SingularAmendment row={row} key={x} disableVotes={loading} voteOutputMap={fetchedVotingData}/>
                            )
                        }
                    })
                }

            </div>
        )
    } else {
        return (
            <h1>No Amendments to be displayed</h1>
        )
    }
}

export default AmendmentDisplay;