import styles from '../styles/Round.module.css'
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import {
    NETWORK, GENESIS_CONTRACT_ADDRESS, MIAMICOIN_CONTRACT_ADDRESS,
    MIAMICOIN_CONTRACT_NAME, MIAMIPOOL_CONTRACT_ADDRESS, MIAMIPOOL_CONTRACT_NAME, API_SERVER, ROUND_LEN
} from '../lib/constants'
import {
    callReadOnlyFunction,
    uintCV,
    ClarityType
} from '@syvita/transactions'
import Link from 'next/link'

export default function Round({ round }) {
    const { handleOpenAuth } = useConnect()
    const { handleSignOut } = useConnect()
    const [userSession] = useAtom(userSessionState)

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

    // Serialization

    console.log(round.blocksWon)


    return (
        <>  
            <h1 className={styles.logo}>MiamiPool</h1>
            <div className={styles.joinPool}>               
                {userSession.isUserSignedIn() && (
                    <>
                        <div />
                        <div className={styles.dashboard}>
                            <div className={styles.round}>
                                <p>Round { round.roundId }</p>
                            </div>
                            <div className={styles.goalProgress}>
                                <div className={styles.progress}>
                                    <div
                                        className={styles.progressBar}
                                        style={{ width: `${(150 / 200) * 100}%` }}
                                    >
                                        <img src={'/stacks.svg'} width={25} height={25} alt='STX logo'></img>
                                    </div>
                                </div>
                                <div className={styles.goalAmount}>{round.totalStx + ' / 200,000 STX GOAL'}</div>
                            </div>
                            <div className={styles.participants}>
                                <p>764 participants</p>
                            </div>
                            <div className={styles.startBlock}>
                                <p>Started at block #{round.blockHeight}</p>
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
                        <button
                            className={styles.signOut}
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </button>
                        
                    </>
                )}
            </div>
        </>
    )
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
    for (let i = 1; i <= currentRoundId; i++) {
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
        participantIds.push(parseInt(round.participantIds.value))
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

    
    const json = JSON.stringify(round.blocksWon, (key, value) =>
    typeof value === "bigint" ? value.toString() + "n" : value
    );
    let isRoundExpired = currentBlockHeight >= (round.startBlock + ROUND_LEN) ? true : false;
    let data = {
        roundId: roundId,
        latestRoundId: latestRoundId,
        currentBlockHeight: currentBlockHeight,
        isRoundExpired: isRoundExpired,
        blockHeight: parseInt(round.blockHeight.value),
        blocksWon: json,
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