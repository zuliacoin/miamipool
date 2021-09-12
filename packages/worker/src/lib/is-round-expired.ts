import { ROUND_LEN } from '.'
import { getRoundStart } from '../contract-calls'

export async function isRoundExpired(
  roundId: number,
  currentBlock: number
): Promise<boolean> {
  const startBlock = await getRoundStart(roundId)

  if (currentBlock >= startBlock + ROUND_LEN) {
    return true
  } else {
    return false
  }
}
