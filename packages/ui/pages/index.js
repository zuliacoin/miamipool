import styles from '../styles/Home.module.css'
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import { StacksTestnet } from '@stacks/network'
import { useEffect, useState } from 'react'
import { useConnect as syConnect } from '@syvita/connect-react'
import Transaction from '../components/Transaction'

import {
    uintCV,
    makeStandardSTXPostCondition,
    PostConditionMode,
    FungibleConditionCode,
    callReadOnlyFunction,
    makeStandardFungiblePostCondition,
    createAssetInfo,
    makeContractFungiblePostCondition,
} from '@syvita/transactions'

export default function Home() {
    const { handleOpenAuth } = useConnect()
    const { handleSignOut } = useConnect()
    const [userSession] = useAtom(userSessionState)
    const [currentRoundId, setCurrentRoundId] = useState()
    const [currentRound, setCurrentRound] = useState()

    const [addAmount, setAddAmount] = useState(0)
    const [withdrawAmount, setWithdrawAmount] = useState(0)
    const [mineRoundId, setMineRoundId] = useState(0)
    const [claimRoundId, setClaimRoundId] = useState(0)
    const [payoutRoundId, setPayoutRoundId] = useState(0)

    const [txId, setTxId] = useState()

    useEffect(() => {
        getCurrentRoundId().then((result) => setCurrentRoundId(result))
        getCurrentRound().then((result) => setCurrentRound(result))
    }, [])

    let STXAddress = ''

    if (userSession.isUserSignedIn()) {
        STXAddress = userSession.loadUserData().profile.stxAddress.mainnet
    }

    const { doContractCall } = syConnect()

    const NETWORK = new StacksTestnet()
    const GENESIS_CONTRACT_ADDRESS = 'SP000000000000000000002Q6VF78'
    const CONTRACT_ADDRESS = 'ST2J2ASASFAS80NGCVP2CVKDCSPR2GF2DQG9V5E3H'
    const CONTRACT_NAME = 'marvellous-bronze-bass'

    async function addFunds() {
        let amount = uintCV(Math.floor(parseFloat(addAmount.trim()) * 1000000))
        await doContractCall({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'add-funds',
            functionArgs: [amount],
            postConditionMode: PostConditionMode.Deny,
            postConditions: [
                makeStandardSTXPostCondition(
                    STXAddress,
                    FungibleConditionCode.Equal,
                    amount.value
                ),
            ],
            network: NETWORK,
        })
    }

    async function withdrawFunds() {
        await doContractCall({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'withdraw-funds',
            functionArgs: [uintCV(withdrawAmount)],
            postConditionMode: PostConditionMode.Deny,
            postConditions: [
                makeStandardSTXPostCondition(
                    STXAddress,
                    FungibleConditionCode.Equal,
                    uintCV(withdrawAmount).value
                ),
            ],
            network: NETWORK,
        })
    }

    async function startRound() {
        await doContractCall({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'start-round',
            functionArgs: [],
            postConditionMode: PostConditionMode.Allow,
            network: NETWORK,
        })
    }

    async function mine() {
        await doContractCall({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'start-round',
            functionArgs: [uintCV(mineRoundId).value],
            postConditionMode: PostConditionMode.Allow,
            network: NETWORK,
        })
    }

    async function claimMiningReward() {
        await doContractCall({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'claim-mining-reward',
            functionArgs: [uintCV(claimRoundId).value],
            postConditionMode: PostConditionMode.Allow,
            network: NETWORK,
        })
    }

    async function payout() {
        await doContractCall({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'claim-mining-reward',
            functionArgs: [uintCV(payoutRoundId).value],
            postConditionMode: PostConditionMode.Allow,
            network: NETWORK,
        })
    }

    async function getCurrentRound() {
        let result = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-round',
            functionArgs: [uintCV(1)],
            network: NETWORK,
            senderAddress: GENESIS_CONTRACT_ADDRESS,
        })

        result = result.value.data
        const json = JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() + 'n' : value
        )

        console.log(result.participantIds.list)

        let participantIds = []
        for (let i = 0; i < result.participantIds.list.length; i++) {
            participantIds.push(parseInt(result.participantIds.value))
        }
        console.log()
        return {
            blockHeight: parseInt(result.blockHeight.value),
            blocksWon: result.blocksWon.list,
            participants: result.participantIds.list,
            totalMiaWon: parseInt(result.totalMiaWon.value),
            totalStx: parseInt(result.totalStx.value),
        }
    }

    async function getCurrentRoundId() {
        const result = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-current-round-id',
            functionArgs: [],
            network: NETWORK,
            senderAddress: GENESIS_CONTRACT_ADDRESS,
        })
        console.log('Current Round Id ' + result.value.value)
        return parseInt(result.value.value)
    }

    return (
        <>  
            <h1 className={styles.logo}>Swap</h1>
            <div className={styles.joinPool}>
                <img src="/mia.svg" height="64" width="64" alt="MIA Logo"></img>
                <h1>Join MiamiPool</h1>
               
                {userSession.isUserSignedIn() && (
                    <>
                        <div />   
                        <div className={styles.backgroundGradient}> 
                            <p>Round {currentRoundId}</p>
                            {currentRound && currentRound.totalStx / 1000000}
                        </div>
                        <input
                            onWheel={(e) => e.target.blur()}
                            type="number"
                            name="add funds"
                            placeholder="Amount in STX"
                            onChange={(event) =>
                                setAddAmount(event.target.value)
                            }
                        ></input>
                        <button onClick={addFunds}>
                            Add Funds
                        </button>

                        <input
                            onWheel={(e) => e.target.blur()}
                            type="number"
                            name="Withdraw funds"
                            placeholder="Amount in STX"
                            onChange={(event) =>
                                setWithdrawAmount(event.target.value)
                            }
                        ></input>
                        <button
                            onClick={withdrawFunds}
                        >
                            Withdraw Funds
                        </button>

                        {/* <button  onClick={mine}>
                            Mine
                        </button>

                        <button
                            
                            onClick={claimMiningReward}
                        >
                            Claim Mining Reward
                        </button>

                        <button  onClick={payout}>
                            Payout
                        </button> */}

                        <button
                            className={styles.signOut}
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </button>
                        
                    </>
                )}
                {!userSession.isUserSignedIn() && (
                    <>
                        <div>
                            <p className={styles.snippet}>
                                Welcome to MiamiPool a completely trustless and
                                decentralized mining pool for earning $MIA!
                                Connect your wallet to contribute STX and mine
                                for $MiamiCoin with a collection of others, to
                                increase your chances of winning. For more
                                information you can view the MiamiPool
                                <a href="I FORGOR"> docs</a>.
                            </p>
                        </div>
                        <button
                         
                            onClick={handleOpenAuth}
                        >
                            Connect Wallet
                        </button>
                    </>
                )}
            </div>
        </>
    )
}
