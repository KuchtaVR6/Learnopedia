import {AmendmentOutput, VotingSupport} from "../backEnd/amendments/Amendment";
import {FC, useEffect, useState} from "react";
import SingularAmendment from "./contentDisplays/singularAmendment";
import {gql, useLazyQuery} from "@apollo/client";

type args = {
    input: AmendmentOutput[]
}

const AmendmentDisplay: FC<args> = ({input}) => {

    let x = 0;

    const [numberUnapproved, setNumberUnapproved] = useState(0)
    const [numberVetoed, setNumberVetoed] = useState(0)

    const [fetchedVotingData, setFetchedVotingData] = useState<Map<number,VotingSupport> | undefined>(undefined)

    const [fetch, {data, loading}] = useLazyQuery(gql`
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
        let array : number[] = [];
        input.map((amend) => {
            if (!amend.applied && !amend.vetoed && amend.id) {
                array.push(amend.id);
            }
        })
        if(window.localStorage.getItem("loggedIn")==="true" && array.length>0)
        {
            fetch({variables : { amendmentIds : array}})
        }
        setNumberUnapproved(array.length)
        let array2 : number[] = [];
        input.map((amend) => {
            if (amend.vetoed && amend.id) {
                array2.push(amend.id);
            }
        })
        setNumberVetoed(array2.length)
    }, [fetch,input])

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
                        if (!row.applied && !row.vetoed) {
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
                        if (row.applied && !row.vetoed) {
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
                        if (row.vetoed) {
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