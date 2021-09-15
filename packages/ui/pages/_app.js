import '../styles/globals.css'
import { userDataState, userSessionState, useConnect } from '../lib/auth'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { Connect, getUserData } from '@syvita/connect-react'
import Router from 'next/router'
import Loader from '../components/Loader'

function MyApp({ Component, pageProps }) {
    const { authOptions } = useConnect()
    const [userSession] = useAtom(userSessionState)
    const [, setUserData] = useAtom(userDataState)
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userSession?.isUserSignedIn()) {
            setUserData(userSession.loadUserData())
        } else if (userSession.isSignInPending()) {
            userSession.handlePendingSignIn()
        }
    }, [userSession, setUserData])

    Router.events.on('routeChangeStart', (url) => {
        console.log('ROUTE IS CHANGING...')
        setLoading(true)
    })
    Router.events.on('routeChangeComplete', (url) => {
        console.log('ROUTE CHANGING IS COMPLETE...')
        setLoading(false)
    })
    return (
        <Connect authOptions={authOptions}>
            {loading && <Loader />}
            <Component {...pageProps} />
        </Connect>
    )
}

export default MyApp
