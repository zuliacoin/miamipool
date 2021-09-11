import { AnchorMode, PostConditionMode } from 'micro-stacks/transactions'
import { MIAMIPOOL_ADDY, MIAMIPOOL_NAME, NETWORK } from '.'

export function getDefaultTxOptions(args: any, functionName: string) {
  return {
    contractAddress: MIAMIPOOL_ADDY,
    contractName: MIAMIPOOL_NAME,
    functionName: functionName,
    functionArgs: args,
    // @ts-ignore - PRIVATE_KEY is set as a encrypted secret
    senderKey: PRIVATE_KEY,
    validateWithAbi: true,
    NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  }
}

export function getReadonlyTxOptions(args: any, functionName: string) {
  return {
    contractAddress: MIAMIPOOL_ADDY,
    contractName: MIAMIPOOL_NAME,
    functionName: functionName,
    functionArgs: args,
    NETWORK,
    senderAddress: MIAMIPOOL_ADDY,
  }
}
