import {
  mine,
  claim,
  payout,
  getNextIncompleteRound,
  getRoundStatus,
} from './contract-calls'
import { canClaimBlock } from './lib'

export async function handleCron(event: ScheduledEvent): Promise<Response> {
  const round = await getNextIncompleteRound()

  if (round == -1) {
    console.log('No incomplete rounds to operate on.')
    return new Response()
  }

  console.log(`Using round ${round}`)
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
    return new Response(JSON.stringify(result))
  } else {
    if (!hasClaimed && canClaimBlock(nextBlockToCheck)) {
      console.log(`Attempting claim on block ${nextBlockToCheck}...`)
      const result = await claim(round)
      console.log('Sent mining TX')
      return new Response(JSON.stringify(result))
    } else {
      if (!hasPaidOut) {
        console.log('Attempting payout...')
        const result = await payout(round)
        console.log('Sent payout TX')
        return new Response(JSON.stringify(result))
      } else {
        console.log('Doing nothing.')
        // do nothing
        return new Response()
      }
    }
  }
}
