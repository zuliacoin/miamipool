;; an automated $miami coin mining pool/dao created by Asteria of the Syvita Guild

;; all rights to this code are reserved for the Stacks address:
;;      SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66
;; as of Bitcoin block #688906 or the common era year 2021

(define-constant IDLE_PHASE_CODE u0)
(define-constant PREPARE_PHASE_CODE u1)
(define-constant SPEND_PHASE_CODE u2)
(define-constant REDEEM_PHASE_CODE u3)

;; asteria's address (asteria.btc)
(define-constant FEE_PRINCIPLE SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66)

(define-data-var preparePhasePeriod uint u5)
(define-data-var spendPhasePeriod uint u30)

(define-data-var currentPhase uint u0)
(define-data-var latestCycleId uint u0)

(define-data-var latestCycleTotalParticipants uint u0)
(define-data-var latestCycleTotaluStx uint u0)

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

(define-public (start-prepare-phase)
    ;; in order for someone to start a prepare phase, these need to be checked
    ;;   - there is not already a cycle occurring (in prepare or spend phase)

    (begin expr-1 expr-2)
)
(define-public (start-spend-phase))

(define-public (contribute-funds))
(define-public (redeem-rewards))

(define-read-only (get-latest-cycle-id))

(define-read-only (get-latest-cycle-total))
(define-read-only (get-previous-cycle-total (cycleId uint))
    ;; if cycleId is latest cycle fail
)

(define-read-only (get-latest-cycle-participants))
(define-read-only (get-previous-cycle-participants (cycleId uint))
    ;; if cycleId is latest cycle fail
)

(define-read-only (get-latest-cycle-prepare-phase))
(define-read-only (get-previous-cycle-prepare-phase (cycleId uint))
    ;; if cycleId is latest cycle fail
)

(define-read-only (get-latest-cycle-spend-phase))
(define-read-only (get-previous-cycle-spend-phase (cycleId uint))
    ;; if cycleId is latest cycle fail
)