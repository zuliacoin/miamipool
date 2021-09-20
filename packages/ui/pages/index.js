import styles from '../styles/Home.module.css'
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import Router from 'next/router'
import { useConnect as syConnect } from '@syvita/connect-react'
import Navbar from '../components/Navbar'
import Loader from '../components/Loader'

import {
    NETWORK, GENESIS_CONTRACT_ADDRESS, MIAMICOIN_CONTRACT_ADDRESS,
    MIAMICOIN_CONTRACT_NAME, MIAMIPOOL_CONTRACT_ADDRESS, MIAMIPOOL_CONTRACT_NAME, API_SERVER, ROUND_LEN, MATURITY_LEN
} from '../lib/constants'
import {
    callReadOnlyFunction, uintCV, listCV, ClarityType,
    PostConditionMode,
    makeStandardSTXPostCondition,
    FungibleConditionCode,
    standardPrincipalCV,
    makeContractSTXPostCondition
} from '@syvita/transactions'
import { useEffect, useState } from 'react'

export default function Home() {
    const { handleOpenAuth } = useConnect()
    const { handleSignOut } = useConnect()
    const [userSession] = useAtom(userSessionState)

    const [ currentRoundId, setCurrentRoundId ] = useState();
    const [ currentBlockHeight, setCurrentBlockHeight ] = useState();
    const [roundData, setRoundData] = useState();
    const [amount, setAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false)
    const [txId, setTxId] = useState();
    const { doContractCall } = syConnect()

    let STXAddress = ''

    if (userSession.isUserSignedIn()) {
        STXAddress = userSession.loadUserData().profile.stxAddress.testnet
    }

    const roundHistory = []
    
    useEffect(() => {
        setIsLoading(true)
        const getRoundsInfo = async () => {
            let currentRoundId = await callReadOnlyFunction({
                contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
                contractName: MIAMIPOOL_CONTRACT_NAME,
                functionName: 'get-current-round-id',
                functionArgs: [],
                network: NETWORK,
                senderAddress: GENESIS_CONTRACT_ADDRESS,
            })
            currentRoundId = await parseInt(currentRoundId.value.value)
        
            let url = `${API_SERVER}/extended/v1/block?limit=1`
            let currentBlockHeight = await fetch(url)
            currentBlockHeight = await currentBlockHeight.json()
            currentBlockHeight = currentBlockHeight.results[0].height
            
            // let roundsList = []
            let roundData = [];

            for (let i = (currentRoundId - 20); i <= currentRoundId; i++) {
                if (i > 0) {
                    let data = await callReadOnlyFunction({
                        contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
                        contractName: MIAMIPOOL_CONTRACT_NAME,
                        functionName: 'get-round-and-status',
                        functionArgs: [uintCV(i)],
                        network: NETWORK,
                        senderAddress: GENESIS_CONTRACT_ADDRESS,
                    })
                    roundData.push({ roundId: i, data: data })
                }
            }
            
            //     const json = JSON.stringify(roundData[0].data.value.data, (key, value) =>
            //     typeof value === 'bigint' ? value.toString() + 'n' : value
            // )
            // console.log(json)
        
            let parsedRoundData = {};
        
            for (let i = 0; i < roundData.length; i++) {
                let participantIds = []
                for (let j = 0; j < roundData[i].data.value.data.round.data.participantIds.list.length; j++) {
                    participantIds.push(parseInt(roundData[i].data.value.data.round.data.participantIds.list[j].value))
                }
                let blocksWon = []
                for (let j = 0; j < roundData[i].data.value.data.round.data.blocksWon.list.length; j++) {
                    blocksWon.push(parseInt(roundData[i].data.value.data.round.data.blocksWon.list[j].value))
                }
                let id = 0;
                try {
                    id = await callReadOnlyFunction({
                        contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
                        contractName: MIAMIPOOL_CONTRACT_NAME,
                        functionName: 'principal-to-id',
                        functionArgs: [standardPrincipalCV(STXAddress)],
                        network: NETWORK,
                        senderAddress: GENESIS_CONTRACT_ADDRESS,
                    })
                    id = parseInt(id.value.value)
                } catch {}
                
                let contribution = 0;
                if (id > 0) {
                    try {
                        contribution = await callReadOnlyFunction({
                            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
                            contractName: MIAMIPOOL_CONTRACT_NAME,
                            functionName: 'get-contribution',
                            functionArgs: [uintCV(id), uintCV(i + 1)],
                            network: NETWORK,
                            senderAddress: GENESIS_CONTRACT_ADDRESS,
                        })
                        contribution = parseInt(contribution.value.value)
    
                    } catch {} 
                }
                
                parsedRoundData[(i + 1)] = {
                    totalStx: parseInt(roundData[i].data.value.data.round.data.totalStx.value) / 1000000,
                    participantIds: participantIds,
                    blocksWon: blocksWon,
                    totalMiaWon: parseInt(roundData[i].data.value.data.round.data.totalMiaWon.value),
                    blockHeight: parseInt(roundData[i].data.value.data.round.data.blockHeight.value),
                    hasMined: roundData[i].data.value.data.roundsStatus.data.hasMined.type == ClarityType.BoolTrue,
                    hasClaimed: roundData[i].data.value.data.roundsStatus.data.hasClaimed.type == ClarityType.BoolTrue,
                    hasPaidOut: roundData[i].data.value.data.roundsStatus.data.hasPaidOut.type == ClarityType.BoolTrue,
                    nextBlockToCheck: parseInt(roundData[i].data.value.data.roundsStatus.data.nextBlockToCheck.value),
                    lastBlockToCheck: parseInt(roundData[i].data.value.data.roundsStatus.data.lastBlockToCheck.value),
                    requiredPayouts: parseInt(roundData[i].data.value.data.roundsStatus.data.requiredPayouts.value),
                    contribution: contribution / 1000000,
                }
            }
            setIsLoading(false)
            return [currentRoundId, currentBlockHeight, parsedRoundData]
        }
            
        getRoundsInfo().then(result => {
            setCurrentRoundId(result[0])
            setCurrentBlockHeight(result[1])
            setRoundData(result[2])
        })
    }, [])

    async function addFunds() {
        let cvAmount = uintCV(Math.floor(parseFloat(amount) * 1000000))
        await doContractCall({
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
            functionName: 'add-funds',
            functionArgs: [cvAmount],
            postConditionMode: PostConditionMode.Deny,
            postConditions: [
                makeStandardSTXPostCondition(
                    STXAddress,
                    FungibleConditionCode.Equal,
                    cvAmount.value
                ),
            ],
            network: NETWORK,
            onFinish: (result) => {
                setTxId(result.txId);
            },
        })
    }

    async function withdrawFunds() {
        let cvAmount = uintCV(Math.floor(parseFloat(amount) * 1000000))
        await doContractCall({
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
            functionName: 'withdraw-funds',
            functionArgs: [cvAmount],
            postConditionMode: PostConditionMode.Deny,
            postConditions: [
                makeContractSTXPostCondition(
                    MIAMIPOOL_CONTRACT_ADDRESS,
                    MIAMIPOOL_CONTRACT_NAME,
                    FungibleConditionCode.Equal,
                    cvAmount.value
                ),
            ],
            network: NETWORK,
            onFinish: (result) => {
                setTxId(result.txId);
            },
        })
    }

    if (isLoading) {
        return (
            <>
                <Navbar />
                <Loader />
            </>
        )
    }
    else {
        if (roundData) {
            for (let i = currentRoundId; i > 0; i--) {
    
                let status = ''
                let style = { background: 'white' }
                let miningCanBegin = ''
                let addWithdraw = ''
                let mineLength = ''
                let claimingCanBegin = ''
                let winningBlocks = ''
                let remainingBlocks = '';
                let payoutMia = '';
                let payoutNumber = '';

                if (roundData[i].nextBlockToCheck == 0) {
                    status = <div className={styles.raising}><p>RAISING</p><div className={styles.border}></div></div>
                    style = { border: '6px solid #00FAFA'}
                    miningCanBegin = <div className={styles.miningStarts}><p>Mining starts in {(roundData[i].blockHeight + ROUND_LEN) - currentBlockHeight} blocks</p></div>
                    if (currentBlockHeight >= (roundData[i].blockHeight)) {
                        addWithdraw =   <>
                        <div className={styles.addWithdraw}>
                            <input
                                    onWheel={(e) => e.target.blur()}
                                    type="number"
                                    name="Withdraw funds"
                                    placeholder="Amount in STX"
                                    onChange={(event) =>
                                        setAmount(event.target.value)
                                    }
                                ></input>
                                    
                                    <button onClick={addFunds}>
                                        Add Funds
                                </button>
                                <button onClick={withdrawFunds}>
                                    Withdraw Funds
                                </button>
                            <div>   
                                
                        </div>
                            {txId && <p className = {styles.viewTransaction}> <a 
                                    href={`https://explorer.syvita.org/txid/${txId}?chain=testnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View on Explorer
                                </a>
                                </p>
                            }
                            <div className={styles.border}></div>
                        </div>
                    </>
                    }
                    
                    
                } else if (((roundData[i].lastBlockToCheck - roundData[i].nextBlockToCheck) == (ROUND_LEN - 1)) && (!roundData[i].hasClaimed && !roundData[i].hasPaidOut)) {
                    status = <div className={styles.mining}><p>MINING</p><div className={styles.border}></div></div>
                    style = { border: '6px solid #FFCA5F' }
                    mineLength = <div className={styles.mineLength}><p>Mining {ROUND_LEN} blocks</p><div className={styles.border}></div></div>
                    claimingCanBegin = <div className={styles.claimingCanBegin}><p>Claiming starts in {(roundData[i].lastBlockToCheck - currentBlockHeight) + MATURITY_LEN} blocks</p></div>
                } else if (((roundData[i].lastBlockToCheck - roundData[i].nextBlockToCheck) < (ROUND_LEN - 1)) && (roundData[i].nextBlockToCheck <= roundData[i].lastBlockToCheck)) {
                    status = <div className={styles.claiming}><p>CLAIMING</p></div>
                    style = { border: '6px solid #bfabff' }
                    winningBlocks = <div className={styles.winningBlocks}><p>{ roundData[i].blocksWon.length } blocks won</p></div>
                    remainingBlocks = <div className={styles.checkingBlock}><p>{(roundData[i].lastBlockToCheck - roundData[i].nextBlockToCheck) + 1} blocks left to check</p><div className={styles.border}></div></div>
                } else if (roundData[i].hasClaimed && (roundData[i].totalMiaWon > 10000) && (roundData[i].hasPaidOut == false)) {
                    status = <div className={styles.paying}><p>PAYING</p><div className={styles.border}></div></div>
                    style = { border: '6px solid #fab4ff' }
                    payoutMia = <div className={styles.payoutMia}><p>{ roundData[i].totalMiaWon.toLocaleString() } $MIA won</p><div className={styles.border}></div></div>
                    payoutNumber = <div className={styles.payoutsCompleted}><p>{ roundData[i].requiredPayouts } / { Math.floor(roundData[i].participantIds.length / 16) + 1} payouts completed</p></div>
                } else if (roundData[i].hasPaidOut) {
                    status = <div className={styles.complete}><p>COMPLETE</p><div className={styles.border}></div></div>
                    
                    payoutMia = <div><p>{roundData[i].totalMiaWon.toLocaleString()} $MIA won</p></div>
                    winningBlocks = <div className={styles.winningBlocks}><p>{ roundData[i].blocksWon.length } blocks won</p><div className={styles.border}></div></div>

                    style = { background: '#DCDDE2', border: '6px solid black' }
                }
     
                roundHistory.push(
                    <div key={i} className={styles.roundHistory} style={style}>
                        <div className={styles.roundId}>
                            <p>Round {i} </p>
                            <p className={styles.blockHeight}> (#{roundData[i].blockHeight})</p>
                             <div className={styles.border}></div>
                        </div>
                        
                        <div className={styles.totalStx}>
                            <p>{roundData[i].totalStx.toLocaleString()} STX</p>
                            <p>{(roundData[i].totalStx / 150).toFixed(1).toLocaleString()} STX / block</p>
                            <div className={styles.border}></div>
                        </div>
                        
                        <div className={styles.participants}>
                            <p >{roundData[i].participantIds.length} participants</p>
                            <p>You contributed {roundData[i].contribution.toLocaleString()} STX</p>
                            <div className={styles.border}></div>
                        </div>
                        {status}
                        
                        {addWithdraw}
                        
                        {miningCanBegin}

                        {mineLength}
                
                        {claimingCanBegin}

                        {winningBlocks}

                        {remainingBlocks}

                        {payoutMia}

                        {payoutNumber}
                    </div>
                )
            }
        }
        return (
            <>  
                <Navbar />
                <div>
                    <p className={styles.currentBlock}>Current Block: #{currentBlockHeight}</p>
                    {roundHistory}
                </div>
                
            </>
        )
    }
}