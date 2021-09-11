import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  TxBroadcastResult,
} from 'micro-stacks/transactions'
import { uintCV } from 'micro-stacks/clarity'
import { MIAMIPOOL_ADDY, MIAMIPOOL_NAME, NETWORK } from '../constants'
import { getCurrentRound } from './read-only'

// send mine (roundId uint)
// claim (roundId uint)
// payout (roundId uint)

export async function mine(roundId: number): Promise<TxBroadcastResult> {
  const round = await getCurrentRound()
  const txOptions = {
    contractAddress: MIAMIPOOL_ADDY,
    contractName: MIAMIPOOL_NAME,
    functionName: 'mine',
    functionArgs: [uintCV(round)],
    // @ts-ignore
    senderKey: PRIVATE_KEY,
    validateWithAbi: true,
    NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  }

  const transaction = await makeContractCall(txOptions)

  const broadcastResponse = await broadcastTransaction(transaction, NETWORK)
  return broadcastResponse
}

export async function claim(roundId: number): Promise<TxBroadcastResult> {
  const round = await getCurrentRound()
  const txOptions = {
    contractAddress: MIAMIPOOL_ADDY,
    contractName: MIAMIPOOL_NAME,
    functionName: 'mine',
    functionArgs: [uintCV(round)],
    // @ts-ignore
    senderKey: PRIVATE_KEY,
    validateWithAbi: true,
    NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  }

  const transaction = await makeContractCall(txOptions)

  const broadcastResponse = await broadcastTransaction(transaction, NETWORK)
  return broadcastResponse
}