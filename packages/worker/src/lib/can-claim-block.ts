import { MATURITY_LEN } from '.'
import { getCurrentBlock } from '../contract-calls'

export async function canClaimBlock(nextBlockToCheck: number) {
  const currentBlock = await getCurrentBlock()

  if (currentBlock >= nextBlockToCheck + MATURITY_LEN) {
    return true
  } else {
    return false
  }
}
