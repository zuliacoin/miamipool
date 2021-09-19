import { StacksTestnet, StacksMainnet } from '@syvita/micro-stacks/network'

// ========================================================================== //

export const MIAMIPOOL_ADDY = 'ST2J2ASASFAS80NGCVP2CVKDCSPR2GF2DQG9V5E3H'

export const API_SERVER = 'https://stacks-node-api.testnet.stacks.co'
// export const API_SERVER = 'https://stacks-node-api.mainnet.stacks.co'

export const MIAMIPOOL_NAME = 'yawning-purple-raccoon'

export const MATURITY_LEN = 10
// export const MATURITY_LEN = 100

export const ROUND_LEN = 5
// export const ROUND_LEN = 150

export const NETWORK = new StacksTestnet()
// export const NETWORK = new StacksMainnet()

export * from './tx-options'
export * from './sendToMiamiPool'
export * from './can-claim-block'
export * from './is-round-expired'
