import { callReadOnlyFunction } from 'micro-stacks/transactions'
import { getReadonlyTxOptions } from '../lib'
import { ClarityType, ClarityValue, trueCV, uintCV } from 'micro-stacks/clarity'

export async function getFirstIncompleteRound(): Promise<number> {
  return 1
}

export async function getRoundStatus(roundId: number): Promise<object> {
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
