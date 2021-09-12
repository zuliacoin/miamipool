import { callReadOnlyFunction } from 'micro-stacks/transactions'
import { getReadonlyTxOptions } from '../lib'
import { ClarityType, uintCV } from 'micro-stacks/clarity'

export async function getRoundStatus(
  roundId: number
): Promise<{ hasMined: boolean; hasClaimed: boolean; hasPaidOut: boolean }> {
  const options = getReadonlyTxOptions([uintCV(roundId)], 'get-round-status')
  const result = await callReadOnlyFunction(options)
  // @ts-ignore
  const data = result.value.data

  return {
    hasMined: data.hasMined.type == ClarityType.BoolTrue,
    hasClaimed: data.hasClaimed.type == ClarityType.BoolTrue,
    hasPaidOut: data.hasPaidOut.type == ClarityType.BoolTrue,
  }
}

export async function getNextIncompleteRound(): Promise<number> {
  const options = getReadonlyTxOptions([], 'get-incomplete-rounds')
  const result = await callReadOnlyFunction(options)
  // @ts-ignore
  return parseInt(result.value.list.value[0])
}
