import { AnchorMode, PostConditionMode } from 'micro-stacks/transactions'
import { MIAMIPOOL_ADDY, MIAMIPOOL_NAME, NETWORK } from '.'

export function getDefaultTxOptions(args: any, functionName: string) {
  return {
    contractAddress: MIAMIPOOL_ADDY,
    contractName: MIAMIPOOL_NAME,
    functionName: functionName,
    functionArgs: args,
    senderKey:
      // @ts-ignore - PRIVATE_KEY is set as a encrypted secret
      PRIVATE_KEY || '<put_priv_key_here>',
    validateWithAbi: true,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 10000n,
  }
}

export function getReadonlyTxOptions(args: any, functionName: string) {
  return {
    contractAddress: MIAMIPOOL_ADDY,
    contractName: MIAMIPOOL_NAME,
    functionName: functionName,
    functionArgs: args,
    network: NETWORK,
    senderAddress: MIAMIPOOL_ADDY,
  }
}
