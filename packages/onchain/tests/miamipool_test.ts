import { activateCitycoin } from "./citycoin/activate-citycoin.ts";
import {
  startRoundAndInit,
  startRoundToCorrectValues,
  startRoundWhenPrevRoundIsMining,
  startRoundAfterPrevRoundMined,
} from "./miamipool/start-round.ts";
import {
  addFundsAddToRound,
  addFundsAndIncreaseContributedStx,
  addFundsAndIncreaseRoundStx,
  addFundsAndAddToHistory,
  addFundsUnderMin,
  addFundsToExpiredRound,
} from "./miamipool/add-funds.ts";
import {
  withdrawAndDecreaseStx,
  withdrawAndDecreaseRoundStx,
  withdrawMoreThanBalance,
  withdrawWithoutContributing,
  withdrawAndRemoveHistory,
  withdrawAndRemoveFromRound,
  withdrawAfterRoundExpired,
} from "./miamipool/withdraw.ts";
import {
  mineRoundSuccessfully,
  mineWithoutMin,
  mineWhenAlreadyMined,
  mineWhenRaising,
} from "./miamipool/mine.ts";
import {
  claimBeforeMining,
  claimBeforeMaturity,
  claimWithoutEnoughStx,
  claimOnClaimableBlock,
  claimAfterAllChecked,
} from "./miamipool/can-claim.ts";
import {
  payoutBeforeMiningStarts,
  payoutAfterAllRedeemed,
  payoutAfterAllPaidOut,
} from "./miamipool/payout.ts";

activateCitycoin();

startRoundAndInit();
startRoundToCorrectValues();
startRoundWhenPrevRoundIsMining();
startRoundAfterPrevRoundMined();

addFundsAddToRound();
addFundsAndIncreaseContributedStx();
addFundsAndIncreaseRoundStx();
addFundsAndAddToHistory();
addFundsUnderMin();
addFundsToExpiredRound();

withdrawAndDecreaseStx();
withdrawAndDecreaseRoundStx();
withdrawMoreThanBalance();
withdrawWithoutContributing();
withdrawAndRemoveHistory();
withdrawAndRemoveFromRound();
withdrawAfterRoundExpired();

mineRoundSuccessfully();
mineWithoutMin();
mineWhenAlreadyMined();
mineWhenRaising();

claimBeforeMining();
claimBeforeMaturity();
claimWithoutEnoughStx();
claimOnClaimableBlock();
claimAfterAllChecked();

payoutBeforeMiningStarts();
payoutAfterAllRedeemed();
payoutAfterAllPaidOut();
