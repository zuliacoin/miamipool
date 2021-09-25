import { StacksMainnet } from 'micro-stacks/network'

// ========================================================================== //

export const MIAMIPOOL_ADDY = 'SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66'

export const API_SERVER = 'https://stacks-node-api.mainnet.stacks.co'

export const MIAMIPOOL_NAME = 'miamipool-v1'

export const MATURITY_LEN = 100

export const ROUND_LEN = 150

export const NETWORK = new StacksMainnet()

export * from './tx-options'
export * from './sendToMiamiPool'
export * from './can-claim-block'
export * from './is-round-expired'
