import { ClarityType, ClarityValue, uintCV } from 'micro-stacks/clarity'
import {
  callReadOnlyFunction,
  pubKeyfromPrivKey,
} from 'micro-stacks/transactions'
import {
  mine,
  claim,
  payout,
  getRoundStatus,
  getCurrentRoundId,
  getCurrentBlock,
  getIncompleteRounds,
  getRound,
} from './contract-calls'
import {
  API_SERVER,
  canClaimBlock,
  isRoundExpired,
  MIAMIPOOL_ADDY,
  MIAMIPOOL_NAME,
  NETWORK,
} from './lib'

export async function handleCron(event: ScheduledEvent): Promise<Response> {
  // @ts-ignore - cron does exist it's just tsc is dumb
  if (event.cron === '* * * * *') {
    // do API data update stuff
    return await handleDataRefresh()
  } else {
    // if on 5 min cron
    // do contract bot stuff
    return await handleBot()
  }
}

async function handleBot(): Promise<Response> {
  const currentRound = await getCurrentRoundId()
  const currentBlock = await getCurrentBlock()

  if (await isRoundExpired(currentRound, currentBlock)) {
    console.log(`Current block: #${currentBlock}`)
    console.log(`Current round (${currentRound}) has expired.`)
    console.log('Attempting mine...')
    const result = await mine(currentRound)
    console.log('Sent mining TX')
    console.log(`TX: ${JSON.stringify(result)}`)
    return new Response()
  }

  const rounds = await getIncompleteRounds()

  console.log(`ROUNDS: ${rounds}`)

  // @ts-ignore
  if (rounds == -1) {
    console.log('No incomplete rounds to operate on.')
    return new Response()
  }

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i]

    console.log(`Processing round ${round}`)
    const roundStatus = await getRoundStatus(round)
    console.log(`Round status: ${JSON.stringify(roundStatus)}`)

    const hasMined = roundStatus.hasMined
    const hasClaimed = roundStatus.hasClaimed
    const hasPaidOut = roundStatus.hasPaidOut
    const nextBlockToCheck = roundStatus.nextBlockToCheck

    console.log(`Next block to check is #${nextBlockToCheck}`)

    if (!hasMined) {
      console.log('Attempting mine...')
      const result = await mine(round)
      console.log('Sent mining TX')
      console.log(`TX: ${JSON.stringify(result)}`)
    } else {
      if (!hasClaimed && canClaimBlock(nextBlockToCheck)) {
        console.log(`Attempting claim on block ${nextBlockToCheck}...`)
        const result = await claim(round)
        console.log('Sent mining TX')
        console.log(`TX: ${JSON.stringify(result)}`)
      } else {
        if (!hasPaidOut) {
          console.log('Attempting payout...')
          const result = await payout(round)
          console.log('Sent payout TX')
          console.log(`TX: ${JSON.stringify(result)}`)
        } else {
          console.log('Doing nothing.')
        }
      }
    }
  }
  return new Response()
}

async function handleDataRefresh(): Promise<Response> {
  const currentRound = await getCurrentRoundId()
  console.log(`Current round: ${currentRound}`)
  // @ts-ignore
  await KV.put('currentBlock', (await getCurrentBlock()).toString())
  // @ts-ignore
  await KV.put('currentRound', currentRound.toString())
  // @ts-ignore
  const lastCachedRound = await KV.get('lastCachedRound')
  if (lastCachedRound == null) {
    console.log(`Last cached round is null, adding round 1`)
    // @ts-ignore
    await KV.put('lastCachedRound', '1')
    console.log(await constructRoundValue(1))
    // @ts-ignore
    await KV.put('round-1', await constructRoundValue(1))
  } else if (parseInt(lastCachedRound) != currentRound) {
    const roundId = parseInt(lastCachedRound) + 1
    console.log(
      `Last cached round (${lastCachedRound}) is not current round (${currentRound}). Caching next round (${roundId})`
    )
    // @ts-ignore
    await KV.put(`round-${roundId}`, await constructRoundValue(roundId))
    await KV.put('lastCachedRound', roundId.toString())
  } else if (parseInt(lastCachedRound) == currentRound) {
    console.log(
      `Last cached round (${lastCachedRound}) is current round. Revalidating round ${currentRound}.`
    )
    await KV.put(
      `round-${currentRound}`,
      await constructRoundValue(currentRound)
    )
  }
  return new Response()
}

async function constructRoundValue(roundId: number) {
  const roundData = await getRound(roundId)
  const roundStatus = await getRoundStatus(roundId)

  function getParticipantIds() {
    let participantIds = []
    // @ts-ignore
    for (let j = 0; j < roundData.participantIds.list.length; j++) {
      // @ts-ignore
      participantIds.push(parseInt(roundData.participantIds.list[j].value))
    }
    return participantIds
  }

  function getBlocksWon() {
    let blocksWon = []
    // @ts-ignore
    for (let j = 0; j < roundData.blocksWon.list.length; j++) {
      // @ts-ignore
      blocksWon.push(parseInt(roundData.blocksWon.list[j].value))
    }
    return blocksWon
  }

  // @ts-ignore
  return JSON.stringify({
    totalStx: parseInt(roundData.totalStx.value),
    participantIds: getParticipantIds(),
    blocksWon: getBlocksWon(),
    totalMiaWon: parseInt(roundData.totalMiaWon.value),
    blockHeight: parseInt(roundData.blockHeight.value),
    hasMined: roundStatus.hasMined,
    hasClaimed: roundStatus.hasClaimed,
    hasPaidOut: roundStatus.hasPaidOut,
    nextBlockToCheck: roundStatus.nextBlockToCheck,
    lastBlockToCheck: roundStatus.lastBlockToCheck,
    requiredPayouts: roundStatus.requiredPayouts,
  })
}
