import { callReadOnlyFunction } from 'micro-stacks/transactions'
import { API_SERVER, getDefaultTxOptions, getReadonlyTxOptions } from '../lib'
import { ClarityType, uintCV } from 'micro-stacks/clarity'

export async function getRoundStatus(roundId: number): Promise<{
  hasMined: boolean
  hasClaimed: boolean
  hasPaidOut: boolean
  nextBlockToCheck: number
  lastBlockToCheck: number
  requiredPayouts: number
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
    lastBlockToCheck: parseInt(data.lastBlockToCheck.value),
    requiredPayouts: parseInt(data.requiredPayouts.value),
  }
}

export async function getIncompleteRounds(): Promise<Array<number>> {
  const options = getReadonlyTxOptions([], 'get-incomplete-rounds')
  const result = await callReadOnlyFunction(options)

  // @ts-ignore
  const data = result.value

  if (data.list[0] == undefined) {
    return [-1]
  } else {
    var incompleteList = []
    // @ts-ignore
    for (let i = 0; i < data.list.length; i++) {
      // @ts-ignore
      incompleteList.push(parseInt(data.list[i].value))
    }
    console.log(`Incomplete list: ${incompleteList}`)
    return incompleteList
  }
}

export async function getCurrentRoundId(): Promise<number> {
  const options = getReadonlyTxOptions([], 'get-current-round-id')
  const result = await callReadOnlyFunction(options)

  // @ts-ignore
  const data = result.value

  if (data.value == undefined) {
    return -1
  } else {
    return parseInt(data.value)
  }
}

export async function getRoundStart(roundId: number): Promise<number> {
  const options = getReadonlyTxOptions([uintCV(roundId)], 'get-round')
  const result = await callReadOnlyFunction(options)

  // @ts-ignore
  const data = result.value.data

  return parseInt(data.blockHeight.value)
}

export async function getRound(roundId: number) {
  const options = getReadonlyTxOptions([uintCV(roundId)], 'get-round')
  const result = await callReadOnlyFunction(options)
  // @ts-ignore
  return result.value.data
}

export async function getCurrentBlock(): Promise<number> {
  const url = `${API_SERVER}/extended/v1/block?limit=1`
  const response = await fetch(url)
  const result = await response.json()
  return result.results[0].height
}
