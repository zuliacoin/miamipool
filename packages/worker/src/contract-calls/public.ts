import { TxBroadcastResult } from 'micro-stacks/transactions'
import { sendToMiamiPool } from '../lib'
import { getFirstIncompleteRound } from './read-only'

export async function mine(roundId: number): Promise<TxBroadcastResult> {
  const round = await getFirstIncompleteRound()
  return await sendToMiamiPool('mine', round)
}

export async function claim(roundId: number): Promise<TxBroadcastResult> {
  const round = await getFirstIncompleteRound()
  return await sendToMiamiPool('claim-mining-reward', round)
}

export async function payout(roundId: number): Promise<TxBroadcastResult> {
  const round = await getFirstIncompleteRound()
  return await sendToMiamiPool('payout-mia', round)
}
