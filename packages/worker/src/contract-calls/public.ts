import { TxBroadcastResult } from '@syvita/micro-stacks/transactions'
import { sendToMiamiPool } from '../lib'
import { getNextIncompleteRound } from './read-only'

export async function mine(roundId: number): Promise<TxBroadcastResult> {
  return await sendToMiamiPool('mine', roundId)
}

export async function claim(roundId: number): Promise<TxBroadcastResult> {
  return await sendToMiamiPool('claim-mining-reward', roundId)
}

export async function payout(roundId: number): Promise<TxBroadcastResult> {
  return await sendToMiamiPool('payout-mia', roundId)
}
