import {
  makeContractCall,
  broadcastTransaction,
  TxBroadcastResult,
} from '@syvita/micro-stacks/transactions'
import { uintCV } from '@syvita/micro-stacks/clarity'
import { getDefaultTxOptions, NETWORK } from '.'

export async function sendToMiamiPool(
  functionName: string,
  roundId: number
): Promise<TxBroadcastResult> {
  const txOptions = getDefaultTxOptions([uintCV(roundId)], functionName)
  const transaction = await makeContractCall(txOptions)
  const broadcastResponse = await broadcastTransaction(transaction, NETWORK)
  return broadcastResponse
}
