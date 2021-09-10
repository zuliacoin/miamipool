export const mode = 'testnet' // switch between mainnet and testnet

// ========================================================================== //

export const MIAMIPOOL_ADDY = function () {
    if (mode === 'testnet') {
        return 'ST343J7DNE122AVCSC4HEK4MF871PW470ZV04CFXH'
    } else {
        return ''
    }
}

export const API_SERVER = function () {
    if (mode === 'testnet') {
        return 'https://stacks-node-api.testnet.stacks.co'
    } else {
        return 'https://stacks-node-api.mainnet.stacks.co'
    }
}

export const MIAMIPOOL_NAME = function () {
    if (mode === 'testnet') {
        return 'advanced-olive-mackerel'
    } else {
        return ''
    }
}
