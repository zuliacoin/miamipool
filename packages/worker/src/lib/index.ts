import { StacksTestnet, StacksMainnet } from '@syvita/micro-stacks/network'

// ========================================================================== //

export const MIAMIPOOL_ADDY = 'ST343J7DNE122AVCSC4HEK4MF871PW470ZV04CFXH'

export const API_SERVER = 'https://stacks-node-api.testnet.stacks.co'
// export const API_SERVER = 'https://stacks-node-api.mainnet.stacks.co'

export const MIAMIPOOL_NAME = 'soviet-orange-pelican'

export const MATURITY_LEN = 10
// export const MATURITY_LEN = 100

export const ROUND_LEN = 15
// export const ROUND_LEN = 150

export const NETWORK = new StacksTestnet()
// export const NETWORK = new StacksMainnet()

export * from './tx-options'
export * from './sendToMiamiPool'
export * from './can-claim-block'
export * from './is-round-expired'
