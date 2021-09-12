import { callReadOnlyFunction } from 'micro-stacks/transactions'
import { API_SERVER, getReadonlyTxOptions } from '../lib'
import { ClarityType, uintCV } from 'micro-stacks/clarity'

export async function getRoundStatus(roundId: number): Promise<{
  hasMined: boolean
  hasClaimed: boolean
  hasPaidOut: boolean
  nextBlockToCheck: number
}> {
  const options = getReadonlyTxOptions([uintCV(roundId)], 'get-round-status')
  const result = await callReadOnlyFunction(options)
  // @ts-ignore
  const data = result.value.data

  return {
    hasMined: data.hasMined.type == ClarityType.BoolTrue,
    hasClaimed: data.hasClaimed.type == ClarityType.BoolTrue,
    hasPaidOut: data.hasPaidOut.type == ClarityType.BoolTrue,
    nextBlockToCheck: parseInt(data.nextBlockToCheck.value),
  }
}

export async function getNextIncompleteRound(): Promise<number> {
  const options = getReadonlyTxOptions([], 'get-incomplete-rounds')
  const result = await callReadOnlyFunction(options)
  // @ts-ignore
  return parseInt(result.value.list[0].value)
}

export async function getCurrentBlock(): Promise<number> {
  const url = `${API_SERVER}/extended/v1/block?limit=1`
  const response = await fetch(url)
  const result = await response.json()
  return result.results[0].height
}
