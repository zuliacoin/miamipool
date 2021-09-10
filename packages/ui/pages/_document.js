import Document, { Html, Head, Main, FlareactScript } from 'flareact/document'
import { CssBaseline } from '@geist-ui/react'

class MyDocument extends Document {
    static async getEdgeProps(ctx) {
        const props = await Document.getEdgeProps(ctx)
        const styles = CssBaseline.flush()
        return {
            ...props,
            styles: <>{styles}</>,
        }
    }

    render() {
        return (
            <Html>
                <Head />
                <body>
                    <Main />
                    <FlareactScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument
