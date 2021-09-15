import { useCallback } from 'react'
import { AppConfig, UserSession } from '@syvita/connect-react'
import { showConnect } from '@syvita/connect'
import { atom, useAtom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import {
    NETWORK, GENESIS_CONTRACT_ADDRESS, MIAMICOIN_CONTRACT_ADDRESS,
    MIAMICOIN_CONTRACT_NAME, MIAMIPOOL_CONTRACT_ADDRESS, MIAMIPOOL_CONTRACT_NAME, API_SERVER, ROUND_LEN
} from '../lib/constants'
import {
    callReadOnlyFunction,
} from '@syvita/transactions'

import Router from 'next/router'

const appConfig = new AppConfig(['store_write', 'publish_data'])
export const userSessionState = atom(new UserSession({ appConfig }))
export const userDataState = atom()
export const authResponseState = atom()

export const useConnect = () => {
    const [userSession] = useAtom(userSessionState)
    const setUserData = useUpdateAtom(userDataState)
    const setAuthResponse = useUpdateAtom(authResponseState)

    const onFinish = async (payload) => {
        setAuthResponse(payload.authResponse)
        const userData = await payload.userSession.loadUserData()
        setUserData(userData)
        let currentRoundId = await callReadOnlyFunction({
            contractAddress: MIAMIPOOL_CONTRACT_ADDRESS,
            contractName: MIAMIPOOL_CONTRACT_NAME,
            functionName: 'get-current-round-id',
            functionArgs: [],
            network: NETWORK,
            senderAddress: GENESIS_CONTRACT_ADDRESS,
        })
        currentRoundId = await parseInt(currentRoundId.value.value)
        Router.push('/' + currentRoundId)
    }

    const authOptions = {
        onFinish,
        userSession, // usersession is already in state, provide it here
        redirectTo: '/',
        appDetails: {
            name: 'MiamiCoin',
            icon: 'https://x.syvita.org/miamicoin.svg',
        },
    }



    const handleOpenAuth = () => {
        showConnect(authOptions)
    }

    const handleSignOut = useCallback(() => {
        userSession?.signUserOut('/')
    }, [userSession])

    return { handleOpenAuth, handleSignOut, authOptions }
}