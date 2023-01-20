import {FC, useEffect, useState} from "react";
import {GrCheckboxSelected} from "react-icons/gr";
import {GoDiffRemoved, GoReport} from "react-icons/go";
import VoteProgressDisplay from "../contentDisplays/voteProgressDisplay";
import styles from "../../../styles/ContentDisplay.module.css"
import {VotingSupport} from "../../backEnd/amendments/Amendment";
import {gql, useMutation} from "@apollo/client";

type args = {
    applied: boolean,
    cost: number,
    amendmentID: number,
    votingOutput?: VotingSupport
    disableVotes?: boolean
}

const VotingPanel: FC<args> = (args) => {

    const [userOP, setUserOP] = useState(args.votingOutput?.userOP)
    const [votingOutput, setVotingOutput] = useState(args.votingOutput)

    const votingMutation = gql`
        mutation VoteOnAmendment($amendmentId: Int!, $negative: Boolean, $positive: Boolean, $report: Boolean) {
            voteOnAmendment(amendmentID: $amendmentId, negative: $negative, positive: $positive, report: $report) {
                individualSupports {
                    max
                    negatives
                    positives
                }
                amendmentID
                userOP
            }
        }
    `

    const [sendVote, {data, loading}] = useMutation(votingMutation)

    const sendFetch = (val: number) => {
        sendVote({
            variables: {
                amendmentId: args.amendmentID,
                negative: val === -1,
                positive: val === 1,
                report: val === -2
            }
        })

        if (val !== userOP)
            setUserOP(val)
        else
            setUserOP(0)
    }

    useEffect(() => {
        if (data) {
            setVotingOutput(data.voteOnAmendment)
        }
    }, [data])

    let multiplier = 1;

    useEffect(() => {
        if(args.votingOutput)
        {
            setVotingOutput(args.votingOutput)
            multiplier = 2**(args.votingOutput.individualSupports.length);
        }
    }, [args.votingOutput])

    return (
        <table style={{float: "right"}} className={styles.votesTable}>
            <tbody>
            <tr>
                {!args.applied ?
                    <>
                        <td>
                            <button
                                className={"buttonNice"}
                                disabled={args.disableVotes || loading}
                                style={{opacity: userOP === 1 ? "70%" : "inherit"}}
                                onClick={() => {
                                    sendFetch(1)
                                }}
                            >
                                <GrCheckboxSelected/>&nbsp;{userOP === 1 ? "You support" : "Support"}
                            </button>
                        </td>
                        <td>
                            <button
                                className={"buttonNice"}
                                disabled={args.disableVotes || loading}
                                style={{opacity: userOP === -1 ? "70%" : "inherit"}}
                                onClick={() => {
                                    sendFetch(-1)
                                }}
                            >
                                <GoDiffRemoved/>&nbsp;{userOP === -1 ? "You veto" : "Disagree"}
                            </button>
                        </td>
                    </>
                    :
                    ""
                }
                <td>
                    <button
                        className={"buttonNice"}
                        disabled={args.disableVotes}
                        style={{opacity: userOP === -2 ? "70%" : "inherit"}}
                        onClick={() => {
                            sendFetch(-2)
                        }}
                    >
                        <GoReport/>&nbsp;{userOP === -2 ? "You reported" : "Report"}
                    </button>
                </td>
            </tr>
            {!args.applied && votingOutput ?
                <tr>
                    {
                        votingOutput.individualSupports.map((supports, key) => {
                            if (supports.max > 0) {
                                multiplier = multiplier / 2;
                                return (
                                    <td key={key}>
                                        <VoteProgressDisplay cost={args.cost*multiplier}
                                                             level={key === 0 ? "Course" : key === 1 ? "Chapter" : "Lesson"}
                                                             currents={supports}/>
                                    </td>
                                )
                            }
                        })
                    }
                </tr>
                :
                ""
            }

            </tbody>
        </table>
    )
}

export default VotingPanel;