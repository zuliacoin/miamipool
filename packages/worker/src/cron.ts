import {
  mine,
  claim,
  payout,
  getRoundStatus,
  getCurrentRoundId,
  getCurrentBlock,
  getIncompleteRounds,
} from './contract-calls'
import { canClaimBlock, isRoundExpired } from './lib'

export async function handleCron(event: ScheduledEvent): Promise<Response> {
  const currentRound = await getCurrentRoundId()
  const currentBlock = await getCurrentBlock()

  if (await isRoundExpired(currentRound, currentBlock)) {
    console.log(`Current block: #${currentBlock}`)
    console.log(`Current round (${currentRound}) has expired.`)
    console.log('Attempting mine...')
    const result = await mine(currentRound)
    console.log('Sent mining TX')
    console.log(`TXID: 0x${result}`)
    return new Response()
  }

  const rounds = await getIncompleteRounds()

  if (rounds == [-1]) {
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
      console.log(`TXID: 0x${result}`)
    } else {
      if (!hasClaimed && canClaimBlock(nextBlockToCheck)) {
        console.log(`Attempting claim on block ${nextBlockToCheck}...`)
        const result = await claim(round)
        console.log('Sent mining TX')
        console.log(`TXID: 0x${result}`)
      } else {
        if (!hasPaidOut) {
          console.log('Attempting payout...')
          const result = await payout(round)
          console.log('Sent payout TX')
          console.log(`TXID: 0x${result}`)
        } else {
          console.log('Doing nothing.')
        }
      }
    }
  }
  return new Response()
}
