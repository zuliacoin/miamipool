import styles from '../styles/Home.module.css'
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import { StacksTestnet } from '@stacks/network'
import { useEffect, useState } from 'react'
import { useConnect as syConnect } from '@syvita/connect-react'
import Transaction from '../components/Transaction'
// import ProgressBar from '../components/ProgressBar';

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
    const [estimateSTXPerBlock, setEstimateSTXPerBlock] = useState()

    const [addAmount, setAddAmount] = useState(0)
    const [withdrawAmount, setWithdrawAmount] = useState(0)
    const [mineRoundId, setMineRoundId] = useState(0)
    const [claimRoundId, setClaimRoundId] = useState(0)
    const [payoutRoundId, setPayoutRoundId] = useState(0)

    const [txId, setTxId] = useState()

    useEffect(() => {
        getCurrentRoundId().then((result) => setCurrentRoundId(result))
        getCurrentRound().then((result) => setCurrentRound(result))
        getEstimateSTXPerBlock().then((result) => setEstimateSTXPerBlock(result))
    }, [])

    let STXAddress = ''

    if (userSession.isUserSignedIn()) {
        STXAddress = userSession.loadUserData().profile.stxAddress.mainnet
    }

    const { doContractCall } = syConnect()

    const NETWORK = new StacksTestnet()
    const GENESIS_CONTRACT_ADDRESS = 'SP000000000000000000002Q6VF78'
    const MIAMIPOOL_CONTRACT_ADDRESS = 'ST2J2ASASFAS80NGCVP2CVKDCSPR2GF2DQG9V5E3H'
    const MIAMIPOOL_CONTRACT_NAME = 'marvellous-bronze-bass'
    const MIAMICOIN_CONTRACT_ADDRESS = 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A'
    const MIAMICOIN_CONTRACT_NAME = 'citycoin-core-v4'

    async function addFunds() {
        let amount = uintCV(Math.floor(parseFloat(addAmount.trim()) * 1000000))
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
        })
    }

    async function withdrawFunds() {
        await doContractCall({
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
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

    async function getEstimateSTXPerBlock() {
        let url = "https://stacks-node-api.mainnet.stacks.co/extended/v1/block?limit=1";
        const response = await fetch(url);
        let result = await response.json();
        const currentBlock = result.results[0].height;

        result = await callReadOnlyFunction({
            contractAddress: MIAMICOIN_CONTRACT_ADDRESS,
            contractName: MIAMICOIN_CONTRACT_NAME,
            functionName: 'get-mining-stats-at-block',
            functionArgs: [uintCV(currentBlock - 25)],
            network: NETWORK,
            senderAddress: GENESIS_CONTRACT_ADDRESS,
        })

        const json = JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() + 'n' : value
        )
        console.log(json)

        // return 0.1 * (parseInt(result.value.data.amount.value) / 1000000)
        return 207.5
    }

    async function getCurrentRound() {
        let result = await callReadOnlyFunction({
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
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
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
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
            <h1 className={styles.logo}>MiamiPool</h1>
            <div className={styles.joinPool}>               
                {userSession.isUserSignedIn() && (
                    <>
                        <div />
                        <div className={styles.dashboard}>
                            <div className={styles.round}>
                                <p>Round 1</p>
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
                            <div className={styles.goalAmount}>{'150,000 / 200,000 STX GOAL'}</div>
                            </div>
                            <div className={styles.participants}>
                                <p>764 participants</p>
                            </div>
                            <div className={styles.startBlock}>
                                <p>Started at block #1453</p>
                            </div>
                            <div className={styles.miningBegins}>
                                <p>Mining begins in 15 blocks</p>
                            </div>
                            <div className={styles.addWithdraw}>
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
                            </div>

                            <div className={styles.roundData}>
                                <ul>
                                <li>Round 1</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                <li>Test</li>
                                </ul>
                            </div>
                            
                            {/* <div className={styles.roundButtons}>
                                <button className={styles.prevButton}>Prev Round</button>
                                <button className={styles.nextButton}>Next Round</button>
                            </div> */}
 

                        </div>
                        
                   

                   
      
                       

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
