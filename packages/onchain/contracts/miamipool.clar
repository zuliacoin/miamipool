(define-constant preparePhaseCode u1)
(define-constant spendPhaseCode u2)

;; defines the preparation phase
(define-data-var preparePhasePeriod uint u5)
;; defines the spend period
(define-data-var spendPhasePeriod uint u30)
(define-data-var currentPhase uint u0)
(define-data-var latestCycleId uint u0)

(define-map Cycles
    { id: uint } 
    { 
        totalParticipants: uint,
        totaluStxSpent: uint,
        preparePhaseStartedAt: uint,
        spendPhaseStartedAt: uint,
        preparePhaseFinishedAt: uint,
        spendPhaseFinishedAt: uint
    }
)

;; where is the original miamiCoinContract
(define-data-var miamiCoinContract principle SP000000000000000000002Q6VF78)

(define-fungible-token miamipool)

(define-public (initiate-spend-phase))
(define-public (initiate-prepare-phase))

(define-public (contribute-funds))
(define-public (redeem-rewards))

(define-read-only (get-latest-cycle-id))

(define-read-only (get-latest-cycle-total))
(define-read-only (get-previous-cycle-total (cycleId uint)))

(define-read-only (get-latest-cycle-participants))
(define-read-only (get-previous-cycle-participants (cycleId uint)))

(define-read-only (get-latest-cycle-prepare-phase))
(define-read-only (get-previous-cycle-prepare-phase (cycleId uint)))

(define-read-only (get-latest-cycle-spend-phase))
(define-read-only (get-previous-cycle-spend-phase (cycleId uint)))