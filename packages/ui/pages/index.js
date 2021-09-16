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
import { useEffect, useState } from 'react'

export default function Home({ currentRoundId }) {
    const { handleOpenAuth } = useConnect()
    const { handleSignOut } = useConnect()
    const [userSession] = useAtom(userSessionState)

    const [currentRound, setCurrentRound] = useState(1)
    
    useEffect(() => {
        getCurrentRound().then(result => setCurrentRound(result))
    }, [])

    return (
        <>  
        <Navbar/>
            <div className={styles.joinPool}>               
             
                <>
                    <div className={styles.snippet}>
                        <p>
                            Welcome to MiamiPool - an entirely trustless and decentralized mining pool for $MIA!</p>
                            <p>Connect your wallet to contribute STX and mine $MIA with others to increase your chances of winning. For more information you can view the MiamiPool <a href="I FORGOR"> docs</a>.
                        </p>
                    </div>
                    {!userSession.isUserSignedIn() && <button
                        
                        onClick={handleOpenAuth}
                    >
                        Connect Wallet
                    </button>}

                    <button
                        
                        onClick={() => { {Router.push('/' + currentRound)}}}
                    >
                        latest round
                    </button> 
                </>
            
            </div>
        </>
    )
}

const getCurrentRound = async () => {
    let currentRoundId = await callReadOnlyFunction({
        contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
        contractName: MIAMIPOOL_CONTRACT_NAME,
        functionName: 'get-current-round-id',
        functionArgs: [],
        network: NETWORK,
        senderAddress: GENESIS_CONTRACT_ADDRESS,
    })
    currentRoundId = await parseInt(currentRoundId.value.value)

    return currentRoundId
}