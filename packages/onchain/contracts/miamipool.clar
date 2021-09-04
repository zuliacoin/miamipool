;;    ////  _______ _____ _______ _______ _____  _____   _____   _____          \\\\    ;;
;;          |  |  |   |   |_____| |  |  |   |   |_____] |     | |     | |               ;;
;;    \\\\  |  |  | __|__ |     | |  |  | __|__ |       |_____| |_____| |_____  ////    ;;

;;      ||||     A S T E R I A    X     I N V I D I A    X    D I O P I T I S     ||||

;;          ------------------------------------------------------------------          ;;


;;      ////    ERRORS    \\\\      ;;

;; needa update these

;; RBAC (1xx)
(define-constant ERR_INVALID_AMOUNT u100)
(define-constant ERR_ADDRESS_NOT_FOUND u101)
(define-constant ERR_INSUFFICIENT_BALANCE u102)

;; Mining (2xx)
(define-constant ERR_CONTRIBUTION_TOO_LOW u200)


;;      ////    CONFIG    \\\\      ;;

(define-data-var minContribution uint u1000000)
(define-data-var roundDuration uint u100)

(define-data-var feePrinciple principal 'SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66)
(define-data-var fee uint u3)

(define-constant MIA_CONTRACT_ADDRESS (as-contract tx-sender))


;;      ////    STORAGE    \\\\     ;;

;; stores aggregate round data
(define-map Rounds
    { id: uint }
    {
        totalStx: uint, ;; can we use stx-get-balance to update this instead of adding/subtracting the amount they are adding/withdrawing?
        participantIds: (list 4096 uint), ;; are we adding an address to this whenever add-funds is called?
        totalMiaWon: uint,
        blockHeight: uint,
        duration: uint
    }
)

;; stores all contributions
(define-map Contributions
    { id: uint, round: uint }
	{ amount: uint }
)

;; stores up to last 512 rounds a partipant was in
(define-map Participants
    { id: uint }
	{ rounds: (list 512 uint) }
)

;; lookup table to get principle from id
(define-map IdToParticipant
    { id: uint }
    { participant: principal}
)

;; lookup table to get id from principle
(define-map ParticipantToId
    { participant: principal}
    { id: uint }
)

(define-data-var participantIdTip uint u0)
(define-data-var lastRoundId uint u0)


;;      ////    PRIVATE    \\\\       ;;
;; returns participant id if it has been created, or creates and returns new ID
(define-private (get-or-create-participant-id (participant principal))
  (match (get id (map-get? ParticipantToId { participant: participant })) participantId
    participantId
    (let
      ((newId (+ u1 (var-get participantIdTip))))
      (map-set IdToParticipant {id: newId} {participant: participant})
      (map-set ParticipantToId {participant: participant} {id: newId})
      (var-set participantIdTip newId)
      newId
    )
  )
)

;; maybe done? needs checking
(define-private (calculate-return (id uint))
    (let
        (
            (roundId (var-get lastRoundId))

            (totalStx (get totalStx (unwrap-panic 
                (map-get? Rounds { 
                    id: roundId 
                }) 
            )))

            (totalMiaWon (get totalMiaWon (unwrap-panic 
                (map-get? Rounds { 
                    id: roundId 
                }) 
            )))

            (contributionAmount (get amount (unwrap-panic 
                (map-get? Contributions { 
                    id: id, 
                    round: roundId
                })
            )))
        )
        
        (* totalMiaWon (/ contributionAmount totalStx))
    )
)

;; done... i think?
(define-private (round-expired (id uint))
    (let
        (
            (round (unwrap-panic (map-get? Rounds { id: id })))
            (duration (get duration round))
            (blockHeight (get blockHeight round))
            (endBlockHeight (+ blockHeight duration))
        )

        (if (> block-height endBlockHeight)
            true
            false
        )
    )
)

;; add authorisation to this somehow
(define-public (set-min-contribution (amount uint))
    (begin
        (var-set minContribution amount)
        (ok true)
    )
)

;; done
(define-public (start-round)
    (let 
        (
            (newRoundId (+ (var-get lastRoundId) u1))
            (newRoundKeyTuple { id: newRoundId })
            (newRoundValueTuple {
                totalStx: u0,
                participantIds: (list),
                totalMiaWon: u0,
                blockHeight: block-height,
                duration: (var-get roundDuration)
            })
        )

        (begin
            (var-set lastRoundId newRoundId)
            (asserts! (map-insert Rounds newRoundKeyTuple newRoundValueTuple) (err u0))
            (ok true)
        )
    )
)

(define-public (add-funds (amount uint) (round uint))
    (begin
        (asserts! (>= amount (var-get minContribution)) (err ERR_CONTRIBUTION_TOO_LOW))
        (let
            (
                (user contract-caller)
                (participantId (get-or-create-participant-id tx-sender))
            )
            (try! (stx-transfer? amount user MIA_CONTRACT_ADDRESS))
            (ok
                (match (get amount (map-get? Contributions { id: participantId, round: round })) balance
                    (map-set Contributions {id: participantId, round: round} {amount: (+ balance amount)})
                    (map-set Contributions {id: participantId, round: round} {amount: amount})
                )
            )
        )
    )
)

(define-public (withdraw-funds (amount uint) (round uint))
    (begin
        (let
            (
                (user contract-caller)
                (participantId (unwrap-panic (get id (map-get? ParticipantToId { participant: tx-sender }))))
                (balance (unwrap-panic (get amount (map-get? Contributions { id: participantId, round: round }))))
            )
            (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
            (asserts! (<= amount balance) (err ERR_INSUFFICIENT_BALANCE))

            (try! (as-contract (stx-transfer? amount MIA_CONTRACT_ADDRESS user)))
            (ok (map-set Contributions {id: participantId, round: round} {amount: (- balance amount)}))
        )
    )
)

;;      ////    READ-ONLY    \\\\     ;;

;; done
(define-read-only (get-participant (id uint))
    (ok (map-get? Participants { id: id }))
)

;; done
(define-read-only (get-min-contribution)
    (ok (var-get minContribution))
)

;; done
(define-read-only (get-current-round-id)
    (ok (var-get lastRoundId))
)

(define-read-only (get-contribution (id uint) (round uint))
    (ok (get amount (map-get? Contributions { id: id, round: round })))
)

;; done
(define-read-only (get-participant-id (participant principal))
    (ok (get id (map-get? ParticipantToId { participant: participant })))
)

;; done
(define-read-only (get-participant-address (id uint))
    (ok (get participant (map-get? IdToParticipant { id: id })))
)

;; in progress
;; if none, return (ok none) [don't unwrap]
;; if valid, return (ok (tuple... )) [requires unwrap]
(define-read-only (get-round (id uint))
    (ok (map-get? Rounds { id: id }))
)

;; should be done???
(define-read-only (get-current-phase)
    (if (round-expired (var-get lastRoundId))
        ;; 0: idle, no round is active
        ;; 1: active, accepting contributions
        (ok u0)
        (ok u1)
    )
)


;;   ||||     D E C E N T R A L I S E D .    G L O B A L .    S O V E R E I G N .      ||||

;;                    ||||     S Y V I T A    G U I L D     ||||



;; temp clarinet stuff

;; (contract-call? .miamipool start-round)
;; (contract-call? .miamipool get-mining-round u1)
;; (contract-call? .miamipool get-or-create-participant-id 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
;; (contract-call? .miamipool get-participant u1)
;; (contract-call? .miamipool get-participant-address u1)
;; (contract-call? .miamipool add-funds u1000000 u1)
;; (contract-call? .miamipool withdraw-funds u400000 u1)
;; (contract-call? .miamipool get-contribution u1 u1)