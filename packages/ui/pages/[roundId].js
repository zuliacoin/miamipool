import styles from '../styles/Round.module.css'
import Navbar from '../components/Navbar'
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import { StacksMainnet } from '@stacks/network'
import { useConnect as syConnect } from '@syvita/connect-react'
import {
    NETWORK, GENESIS_CONTRACT_ADDRESS, MIAMICOIN_CONTRACT_ADDRESS,
    MIAMICOIN_CONTRACT_NAME, MIAMIPOOL_CONTRACT_ADDRESS, MIAMIPOOL_CONTRACT_NAME, API_SERVER, ROUND_LEN
} from '../lib/constants'
import {
    callReadOnlyFunction,
    uintCV,
    ClarityType,
    doContractCall,
    PostConditionMode,
    makeStandardSTXPostCondition,
    FungibleConditionCode,
    standardPrincipalCV,
    makeContractSTXPostCondition
} from '@syvita/transactions'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Round({ round }) {
    const [userSession] = useAtom(userSessionState)

    const [addAmount, setAddAmount] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState(0);
    const [contribution, setContribution] = useState(0);
    const [txId, setTxId] = useState();

    const { doContractCall } = syConnect()

    let STXAddress = ''

    if (userSession.isUserSignedIn()) {
        STXAddress = userSession.loadUserData().profile.stxAddress.testnet
    }

    useEffect(() => {
        setContribution(0);
        getContribution().then((result) => setContribution(result))
    }, [round.roundId])


    const roundHistory = []
    for (let i = 0; i < round.latestRoundId; i++) {
        roundHistory.push(
            <Link key={ round.latestRoundId } href={'/' + (round.latestRoundId - i)}>
                <a>
                    <li>{'Round ' + (round.latestRoundId - i)}</li>
                </a>
            </Link>
        )
    }
    async function addFunds() {
        let amount = uintCV(Math.floor(parseFloat(addAmount) * 1000000))
        await doContractCall({
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
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
            onFinish: (result) => {
                setTxId(result.txId);
            },
        })
    }

    async function withdrawFunds() {
        let amount = uintCV(Math.floor(parseFloat(withdrawAmount) * 1000000))
        await doContractCall({
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
            functionName: 'withdraw-funds',
            functionArgs: [amount],
            postConditionMode: PostConditionMode.Deny,
            postConditions: [
                makeContractSTXPostCondition(
                    MIAMIPOOL_CONTRACT_ADDRESS,
                    MIAMIPOOL_CONTRACT_NAME,
                    FungibleConditionCode.Equal,
                    amount.value
                ),
            ],
            network: NETWORK,
            onFinish: (result) => {
                setTxId(result.txId);
            },
        })
    }

    async function getContribution() {
        let id = await callReadOnlyFunction({
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
            functionName: 'principal-to-id',
            functionArgs: [standardPrincipalCV(STXAddress)],
            network: NETWORK,
            senderAddress: GENESIS_CONTRACT_ADDRESS,
        })
        id = parseInt(id.value.value)

        let contribution = await callReadOnlyFunction({
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
            functionName: 'get-contribution',
            functionArgs: [uintCV(id), uintCV(round.roundId)],
            network: NETWORK,
            senderAddress: GENESIS_CONTRACT_ADDRESS,
        })
        contribution = parseInt(contribution.value.value)

        return Math.floor(contribution / 1000000)
    }

    if (round.isRoundExpired) { 
        return (
            <>  
            <Navbar/>
               
                <div className={styles.joinPool}>               
                        
                <div className={styles.dashboard}>
                    <div className={styles.round}>
                        <p>Round {round.roundId}</p>
                    </div>
                    <div className={styles.stxRaised}>
                        <p>{Math.floor(round.totalStx) + ' STX'} raised</p>
                    </div>
                        {(contribution > 0) && <div><p className={styles.contribution}>
                            You contributed {contribution} STX
                        </p></div>
                        }
          
                    <div className={styles.firstRow}>
                    <div className={styles.participants}>
                        <p>{round.participants.length} participants</p>
                    </div>
                    <div className={styles.startBlock}>
                        <p>Started at #{round.blockHeight}</p>
                        {/* <p>Current block #{round.currentBlockHeight}</p> */}
                </div>
                </div>
                    <div className={styles.secondRow}>
                       {round.hasMined && <div className={styles.hasMined}><p>Mining has started</p></div>}
                       {!round.hasMined && <div className={styles.hasntMined}><p>Mining not started</p></div>}
                       {!round.hasMined && <div className={styles.hasClaimed}><p>Ends at block #{round.blockHeight + ROUND_LEN}</p></div>}

                 
                    {round.hasMined &&
                        <div className={styles.hasClaimed}>
                            {round.hasClaimed && <p>{round.blocksWon.length} blocks won / {round.totalMiaWon} $MIA</p>}
                            {!round.hasClaimed && <p>Still blocks to be checked.</p>}
                        </div>
                    }
                    </div>
                    {(round.hasMined && round.hasClaimed) && 
                        <div className={styles.hasPaidOut}>
                            {round.hasPaidOut && <p>All participants have received their $MIA rewards.</p>}
                            {!round.hasPaidOut && <p>Not all participants have received their $MIA rewards yet.</p>}
                        </div>
                    }


                    </div>
                    {/* <div className={styles.miningBegins}>
                        <p>Mining begins in 15 blocks</p>
                    </div> */}

                    <div className={styles.roundData}>
                        <ul>
                            {roundHistory}
                        </ul>
                    </div>
                          
                </div>
            </>
        )
    } else { 
        return (
            <>   
            <Navbar/>
               
                <div className={styles.joinPool}>              
                        
                <div className={styles.dashboard}>
                    <div className={styles.round}>
                        <p>Round {round.roundId}</p>
                    </div>
                    {!round.hasMined &&
                    // <div>
                    //     Goal STX for round: {round.estimatedSTXPerBlock * 150} STX | {round.estimatedSTXPerBlock } STX committed per block
                    //         </div>
                    <div className={styles.goalProgress}>
                    <div className={styles.progress}>
                        <div
                            className={styles.progressBar}
                            style={{ width: `${(round.totalStx/ (round.estimatedSTXPerBlock * 150)) * 100}%` }}
                        >
                            <img src={'/stacks.svg'} width={25} height={25} alt='STX logo'></img>
                        </div>
                    </div>
                            <div className={styles.goalAmount}>{round.totalStx} / {(round.estimatedSTXPerBlock * 150)} STX GOAL</div>
                </div>
                    }
                    {(contribution > 0) && <div>
                            You contributed {contribution} STX
                        </div>
                    }
                <div>
                    {round.hasClaimed && <p>{round.totalMiaWon} $MIA Won</p>}
                </div>
                    <div className={styles.firstRow}>
                    <div className={styles.participants}>
                        <p>{round.participants.length} participants</p>
                    </div>
                    <div className={styles.startBlock}>
                        <p>Started at #{round.blockHeight}</p>
                        {/* <p>Current block #{round.currentBlockHeight}</p> */}
                    </div>
                </div>
                    <div className={styles.secondRow}>
                    
                        {round.hasMined && <div className={styles.hasMined}><p>Mining has started</p></div>}
                        {!round.hasMined && <div className={styles.hasntMined}><p>Mining not started</p></div>}
                        {!round.hasMined && <div className={styles.endsAt}><p>Ends at block #{round.blockHeight + ROUND_LEN}</p></div>}
                    
                    {round.hasMined &&
                        <div className={styles.hasClaimed}>
                            {round.hasClaimed && <p>{round.blocksWon.length} blocks won / {round.totalMiaWon} $MIA</p>}
                            {!round.hasClaimed && <p>Still blocks to be checked.</p>}
                        </div>
                    }
                    </div>
                    {(round.hasMined && round.hasClaimed) && 
                        <div className={styles.hasPaidOut}>
                            {round.hasPaidOut && <p>All participants have received their $MIA rewards.</p>}
                            {!round.hasPaidOut && <p>Not all participants have received their $MIA rewards yet.</p>}
                        </div>
                        }
                        <div className={styles.addWithdraw}>
                            {(round.totalStx < (round.estimatedSTXPerBlock * 150)) &&
                                <div>
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
                                </div>
                            }
                      
                            <div>
                                <input
                                    onWheel={(e) => e.target.blur()}
                                    type="number"
                                    name="Withdraw funds"
                                    placeholder="Amount in STX"
                                    onChange={(event) =>
                                        setWithdrawAmount(event.target.value)
                                    }
                                ></input>
                                <button onClick={withdrawFunds}>
                                    Withdraw Funds
                                </button>
                            </div>
                                  {txId && <p className = {styles.viewTransaction}> <a 
                                    href={`https://explorer.syvita.org/txid/${txId}?chain=testnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View on Syvita Explorer
                            </a>
                            </p>
                            }
                        </div>
                            
                        
                        
                    </div>


                    <div className={styles.roundData}>
                        <ul>
                            {roundHistory}
                        </ul>
                    </div>                      
                </div>
            </>
        )
    }
        
    
}


export const getStaticPaths = async () => {
    let currentRoundId = await callReadOnlyFunction({
        contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
        contractName: MIAMIPOOL_CONTRACT_NAME,
        functionName: 'get-current-round-id',
        functionArgs: [],
        network: NETWORK,
        senderAddress: GENESIS_CONTRACT_ADDRESS,
    })
    currentRoundId = await parseInt(currentRoundId.value.value)

    const paths = []
    for (let i = 0; i <= currentRoundId; i++) {
        paths.push({ params: { roundId: i.toString()}})
    }

    return {
        paths: paths,
        fallback: false
    }
}

export const getStaticProps = async (context) => {
    const roundId = context.params.roundId;

    let url = `${API_SERVER}/extended/v1/block?limit=1`
    let currentBlockHeight = await fetch(url)
    currentBlockHeight = await currentBlockHeight.json()
    currentBlockHeight = currentBlockHeight.results[0].height

    let latestRoundId = await callReadOnlyFunction({
        contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
        contractName: MIAMIPOOL_CONTRACT_NAME,
        functionName: 'get-current-round-id',
        functionArgs: [],
        network: NETWORK,
        senderAddress: GENESIS_CONTRACT_ADDRESS,
    })
    latestRoundId = await parseInt(latestRoundId.value.value)

    let round = await callReadOnlyFunction({
        contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
        contractName: MIAMIPOOL_CONTRACT_NAME,
        functionName: 'get-round',
        functionArgs: [uintCV(roundId)],
        network: NETWORK,
        senderAddress: GENESIS_CONTRACT_ADDRESS,
    })
    round = await round.value.data;

    let participantIds = []
    for (let i = 0; i < round.participantIds.list.length; i++) {
        participantIds.push(parseInt(round.participantIds.list[i].value))
    }
    console.log('PARTICIPANT IDS ' + participantIds)
    let blocksWon = []
    for (let i = 0; i < round.blocksWon.list.length; i++) {
        blocksWon.push(parseInt(round.blocksWon.list[i].value))
    }

    let roundStatus = await callReadOnlyFunction({
        contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
        contractName: MIAMIPOOL_CONTRACT_NAME,
        functionName: 'get-round-status',
        functionArgs: [uintCV(roundId)],
        network: NETWORK,
        senderAddress: GENESIS_CONTRACT_ADDRESS,
    })
    roundStatus = await roundStatus.value.data;

    let isRoundExpired = (currentBlockHeight >= (parseInt(round.blockHeight.value) + ROUND_LEN)) ? true : false;

  
    let estimatedSTXPerBlock = await callReadOnlyFunction({
        contractAddress: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
        contractName: 'miamicoin-core-v1',
        functionName: 'get-mining-stats-at-block',
        // functionArgs: [uintCV(currentBlockHeight - 25)],
        functionArgs: [uintCV(30000)],
        network: new StacksMainnet(),
        senderAddress: GENESIS_CONTRACT_ADDRESS,
    })
    const json = JSON.stringify(estimatedSTXPerBlock.value.data.amount.value, (key, value) =>
        typeof value === 'bigint' ? value.toString() + 'n' : value
    )
    console.log(json)
    estimatedSTXPerBlock = 0.1 * (parseInt(estimatedSTXPerBlock.value.data.amount.value) / 1000000)
    

    // let incompleteRounds = await callReadOnlyFunction({
    //     contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
    //     contractName: MIAMIPOOL_CONTRACT_NAME,
    //     functionName: 'get-incomplete-rounds',
    //     functionArgs: [],
    //     network: NETWORK,
    //     senderAddress: GENESIS_CONTRACT_ADDRESS,
    // })
    
    // let incompleteList = []
    // for (let i = 0; i < incompleteRounds.value.list.length; i++) {
    //     incompleteList.push(parseInt(incompleteRounds.value.list[i].value))
    // }

    // console.log(incompleteList)
    
    
    let data = {
        roundId: roundId,
        latestRoundId: latestRoundId,
        currentBlockHeight: currentBlockHeight,
        isRoundExpired: isRoundExpired,
        blockHeight: parseInt(round.blockHeight.value),
        blocksWon: blocksWon,
        estimatedSTXPerBlock: Math.floor(estimatedSTXPerBlock),
        participants: participantIds,
        totalMiaWon: parseInt(round.totalMiaWon.value),
        totalStx: parseInt(round.totalStx.value) / 1000000,
        hasMined: roundStatus.hasMined.type == ClarityType.BoolTrue,
        hasClaimed: roundStatus.hasClaimed.type == ClarityType.BoolTrue,
        hasPaidOut: roundStatus.hasPaidOut.type == ClarityType.BoolTrue,
    }
    
    return {
        props: { round: data}
    }

}