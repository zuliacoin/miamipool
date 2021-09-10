import { GeistProvider, CssBaseline } from '@geist-ui/react'

export default function MyApp({ Component, pageProps }) {
    return (
        <GeistProvider themeType="light">
            <CssBaseline />
            <Component {...pageProps} />
        </GeistProvider>
    )
}
