import {
  AnchorMode,
  PostConditionMode,
} from '@syvita/micro-stacks/transactions'
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
    network: NETWORK,
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
    network: NETWORK,
    senderAddress: MIAMIPOOL_ADDY,
  }
}
