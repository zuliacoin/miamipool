import {
  mine,
  claim,
  payout,
  getNextIncompleteRound,
  getRoundStatus,
} from './contract-calls'

export async function handleCron(event: ScheduledEvent): Promise<Response> {
  const round = await getNextIncompleteRound()
  const roundStatus = await getRoundStatus(round)

  const hasMined = roundStatus.hasMined
  const hasClaimed = roundStatus.hasClaimed
  const hasPaidOut = roundStatus.hasPaidOut

  if (!hasMined) {
    const result = await mine(round)
    return new Response(JSON.stringify(result))
  } else {
    if (!hasClaimed) {
      const result = await claim(round)
      return new Response(JSON.stringify(result))
    } else {
      if (!hasPaidOut) {
        const result = await payout(round)
        return new Response(JSON.stringify(result))
      } else {
        // do nothing
        return new Response()
      }
    }
  }
}
