import { AnchorMode, PostConditionMode } from 'micro-stacks/transactions'
import { MIAMIPOOL_ADDY, MIAMIPOOL_NAME, NETWORK } from '.'

export function getDefaultTxOptions(args: any, functionName: string) {
  return {
    contractAddress: MIAMIPOOL_ADDY,
    contractName: MIAMIPOOL_NAME,
    functionName: functionName,
    functionArgs: args,
    // @ts-ignore - PRIVATE_KEY is set as a encrypted secret
    //senderKey: PRIVATE_KEY, change when we release
    senderKey:
      'decb2c71d6fb861c8e88764605968cfd70d60b25201bc31ba62e6689f1ec020901',
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
