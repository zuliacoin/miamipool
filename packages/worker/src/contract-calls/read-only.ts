import { callReadOnlyFunction } from 'micro-stacks/transactions'
import { getReadonlyTxOptions } from '../lib'
import { ClarityValue, uintCV } from 'micro-stacks/clarity'

export async function getFirstIncompleteRound(): Promise<number> {
  return 1
}

export async function getRoundStatus(roundId:number): Promise<ClarityValue> {
    const options = getReadonlyTxOptions([uintCV(roundId)], 'get-round-status')
    return await callReadOnlyFunction(options)
}
