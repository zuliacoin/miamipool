import {
  makeContractCall,
  broadcastTransaction,
  TxBroadcastResult,
} from 'micro-stacks/transactions'
import { uintCV } from 'micro-stacks/clarity'
import { getDefaultTxOptions, NETWORK } from '../common'

export async function sendToMiamiPool(
  functionName: string,
  roundId: number
): Promise<TxBroadcastResult> {
  const txOptions = getDefaultTxOptions([uintCV(roundId)], functionName)
  const transaction = await makeContractCall(txOptions)
  const broadcastResponse = await broadcastTransaction(transaction, NETWORK)
  return broadcastResponse
}
