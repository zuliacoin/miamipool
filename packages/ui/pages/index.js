import styles from '../styles/Home.module.css'
import { useConnect, userSessionState } from '../lib/auth'
import { useAtom } from 'jotai'
import Router from 'next/router'
import Navbar from '../components/Navbar'
import {
    NETWORK, GENESIS_CONTRACT_ADDRESS, MIAMICOIN_CONTRACT_ADDRESS,
    MIAMICOIN_CONTRACT_NAME, MIAMIPOOL_CONTRACT_ADDRESS, MIAMIPOOL_CONTRACT_NAME, API_SERVER, ROUND_LEN
} from '../lib/constants'
import {
    callReadOnlyFunction,
} from '@syvita/transactions'

export default function Home({ currentRoundId }) {
    const { handleOpenAuth } = useConnect()
    const { handleSignOut } = useConnect()
    const [userSession] = useAtom(userSessionState)


    return (
        <>  
        <Navbar/>
            <h1 className={styles.logo}>MiamiPool</h1>
            <div className={styles.joinPool}>               
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
                    <button
                        
                        // onClick={() => { {Router.push('/' + currentRoundId)}}}
                    >
                        View Rounds
                    </button> 
                </>
            )}
            </div>
        </>
    )
}

export const getStaticProps = async () => {
    let currentRoundId = await callReadOnlyFunction({
        contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
        contractName: MIAMIPOOL_CONTRACT_NAME,
        functionName: 'get-current-round-id',
        functionArgs: [],
        network: NETWORK,
        senderAddress: GENESIS_CONTRACT_ADDRESS,
    })
    currentRoundId = await parseInt(currentRoundId.value.value)

    return {
        props: { currentRoundId: currentRoundId }
    }
}