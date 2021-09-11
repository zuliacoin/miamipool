import { StacksTestnet, StacksMainnet } from 'micro-stacks/network'

// ========================================================================== //

export const MIAMIPOOL_ADDY = 'ST343J7DNE122AVCSC4HEK4MF871PW470ZV04CFXH'

export const API_SERVER = 'https://stacks-node-api.testnet.stacks.co'
// export const API_SERVER = 'https://stacks-node-api.mainnet.stacks.co'

export const MIAMIPOOL_NAME = 'advanced-olive-mackerel'

export const NETWORK = new StacksTestnet()
// export const NETWORK = new StacksMainnet()

export * from './tx-options'