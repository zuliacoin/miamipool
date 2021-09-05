;;    ////  _______ _____ _______ _______ _____  _____   _____   _____          \\\\    ;;
;;          |  |  |   |   |_____| |  |  |   |   |_____] |     | |     | |               ;;
;;    \\\\  |  |  | __|__ |     | |  |  | __|__ |       |_____| |_____| |_____  ////    ;;

;;    ||||      A S T E R I A    X    I N V I D I A    X    D I O P I T I S     ||||

;;          ------------------------------------------------------------------          ;;


;;      ////    ERRORS    \\\\      ;;

;; needa update these

;; RBAC (1xx)
(define-constant ERR_INVALID_AMOUNT u100)
(define-constant ERR_ID_NOT_FOUND u101)
(define-constant ERR_ID_NOT_IN_ROUND u102)
(define-constant ERR_INSUFFICIENT_BALANCE u103)

;; Mining (2xx)
(define-constant ERR_CONTRIBUTION_TOO_LOW u200)
(define-constant ERR_ROUND_NOT_FOUND u201)
(define-constant ERR_CANNOT_MINE_IF_ROUND_ACTIVE u202)
(define-constant ERR_CANNOT_ADD_FUNDS_TO_EXPIRED_ROUND u203)
(define-constant ERR_MINE_TOTAL_NOT_BALANCE_TOTAL u204)
(define-constant ERR_BLOCK_ALREADY_CHECKED u205)
(define-constant ERR_WAIT_100_BLOCKS_BEFORE_CHECKING u206)



(define-data-var participantIdTip uint u0)
(define-data-var idToRemove uint u0)

(define-data-var lastKnownRoundId  uint u0)
(define-data-var lastBlockChecked uint block-height)


;;      ////    CONFIG    \\\\      ;;

(define-data-var minContribution uint u1000000)
(define-data-var roundDuration uint u2)

(define-data-var feePrincipal principal 'SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66)
(define-data-var fee uint u3)

(define-constant MIA_CONTRACT_ADDRESS (as-contract tx-sender))


;;      ////    STORAGE    \\\\     ;;

;; stores aggregate round data
(define-map Rounds
    { id: uint }
    {
        totalStx: uint,
        participantIds: (list 4096 uint),
        blocksWon: (list 200 uint),
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
	{ roundsParticipated: (list 512 uint) }
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



;;      ////    PRIVATE    \\\\       ;;
;; returns participant id if it has been created, or creates and returns new ID
(define-private (get-or-create-participant-id (participant principal))
  (match (get id (map-get? ParticipantToId { participant: participant })) participantId
    participantId
    (let
      ((newId (+ u1 (var-get participantIdTip))))
      (map-set Participants {id: newId} {roundsParticipated: (list)})
      (map-set IdToParticipant {id: newId} {participant: participant})
      (map-set ParticipantToId {participant: participant} {id: newId})
      (var-set participantIdTip newId)
      newId
    )
  )
)

(define-private (is-not-id (participantId uint))
  (not (is-eq participantId (var-get idToRemove)))
)


;; maybe done? needs checking
(define-private (calculate-return (id uint))
    (let
        (
            (roundId (var-get lastKnownRoundId ))

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
(define-private (is-round-expired (id uint))
    (let
        (
            (round (unwrap-panic (map-get? Rounds { id: id })))
            (duration (get duration round))
            (blockHeight (get blockHeight round))
            (endBlockHeight (+ blockHeight duration))
        )

        ;; ONLY >= FOR TESTING, CHANGE BACK TO >
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
            (newRoundId (+ (var-get lastKnownRoundId) u1))
            (newRoundKeyTuple { id: newRoundId })
            (newRoundValueTuple {
                totalStx: u0,
                participantIds: (list),
                blocksWon: (list),
                totalMiaWon: u0,
                blockHeight: block-height,
                duration: (var-get roundDuration)
            })
        )

        (begin
            (var-set lastKnownRoundId newRoundId)
            (asserts! (map-insert Rounds newRoundKeyTuple newRoundValueTuple) (err u0))
            (ok true)
        )

    )
)

(define-public (add-funds (amount uint))
    (begin
        (let
            (
                (address tx-sender)
                (roundId (var-get lastKnownRoundId))
                (participantId (get-or-create-participant-id address))
                (participant (unwrap-panic (map-get? Participants {id: participantId})))
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
            )

            (asserts! (>= amount (var-get minContribution)) (err ERR_CONTRIBUTION_TOO_LOW))
            (asserts! (not (is-round-expired roundId)) (err ERR_CANNOT_ADD_FUNDS_TO_EXPIRED_ROUND))

            (try! (stx-transfer? amount address MIA_CONTRACT_ADDRESS))
            (match (get amount (map-get? Contributions { id: participantId, round: roundId })) balance
                (map-set Contributions {id: participantId, round: roundId} {amount: (+ balance amount)})
                (map-set Contributions {id: participantId, round: roundId} {amount: amount})
            )
            (map-set Participants {id: participantId}
                {
                    roundsParticipated:
                    (match (index-of (get roundsParticipated participant) roundId) val
                        (get roundsParticipated participant)
                        (unwrap-panic (as-max-len? (append (get roundsParticipated participant) roundId) u512))
                    )
                }
            )
            (map-set Rounds {id: roundId}
                {
                    totalStx: (+ (get totalStx rounds) amount),
                    participantIds: 
                    (match (index-of (get participantIds rounds) participantId) val
                        (get participantIds rounds)
                        (unwrap-panic (as-max-len? (append (get participantIds rounds) participantId) u4096))
                    ),
                    blocksWon: (get blocksWon rounds),
                    totalMiaWon: (get totalMiaWon rounds),
                    blockHeight: (get blockHeight rounds),
                    duration: (get duration rounds)
                }
            )
            (ok true)
        )
    )
)

(define-public (withdraw-funds (amount uint))
    (begin
        (let
            (
                (roundId (var-get lastKnownRoundId))
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (participantId (unwrap! (get id (map-get? ParticipantToId { participant: tx-sender })) (err ERR_ID_NOT_FOUND)))
                (participant (unwrap-panic (map-get? Participants {id: participantId})))
                (balance (unwrap-panic (get amount (map-get? Contributions { id: participantId, round: roundId }))))
            )
            (asserts! (is-some (index-of (get participantIds rounds) participantId)) (err ERR_ID_NOT_IN_ROUND))
            (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
            (asserts! (<= amount balance) (err ERR_INSUFFICIENT_BALANCE))

            (try! (as-contract (stx-transfer? amount MIA_CONTRACT_ADDRESS tx-sender)))
            (map-set Contributions {id: participantId, round: roundId} {amount: (- balance amount)})
            (map-set Participants {id: participantId}
                {
                    roundsParticipated:
                    (if (>= amount balance)
                        (begin
                            (var-set idToRemove participantId)
                            (filter is-not-id (get roundsParticipated participant))
                        )
                        (get roundsParticipated participant)
                    ),
                }
            )
            (map-set Rounds {id: roundId}
                {
                    totalStx: (- (get totalStx rounds) amount),
                    participantIds: 
                    (if (>= amount balance)
                        (begin
                            (var-set idToRemove participantId)
                            (filter is-not-id (get participantIds rounds))
                        )
                        (get participantIds rounds)
                    ),
                    blocksWon: (get blocksWon rounds),
                    totalMiaWon: (get totalMiaWon rounds),
                    blockHeight: (get blockHeight rounds),
                    duration: (get duration rounds)
                }
            )
            (ok true)
        )
    )
)

;; add operator auth to this
(define-public (mine-many (amounts (list 200 uint)))
    (begin
        (asserts! (is-round-expired (var-get lastKnownRoundId )) (err ERR_CANNOT_MINE_IF_ROUND_ACTIVE))
        (asserts! 
            (is-eq (fold + amounts u0) (unwrap-panic (get totalStx (map-get? Rounds {id: (var-get lastKnownRoundId)})))) 
            (err ERR_MINE_TOTAL_NOT_BALANCE_TOTAL)
        )
        ;; (try! (contract-call? 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-core-v4 mine-many amounts))
        (var-set lastBlockChecked (- block-height u1))
        (ok true)
    )
)

;; WILL CHANGE similar to the function below. We'll have the won blocks list so we can just check another block in that list every time someone calls this function.
;; this means we won't need to pass in a any arguments
(define-public (claim-mining-reward (minerBlockHeight uint))
    ;; (try! (contract-call? 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-core-v4 claim-mining-reward minerBlockHeight))
    (ok true)
)

;; WILL CHANGE THIS so that the contract already has the blocks it mined and someone just needs to call it after 100 blocks to check them all
;; again this means we won't need to pass in a any arguments
(define-public (can-claim-mining-reward)
    (let
        (
            (roundId (var-get lastKnownRoundId))
            (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
            (lastBlock (var-get lastBlockChecked))
            ;; (isWinner (contract-call? 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-core-v4 can-claim-mining-reward MIA_CONTRACT_ADDRESS lastBlockChecked))
            (isWinner true)
            
        )
        (asserts! (is-some (index-of (get blocksWon rounds) lastBlock)) (err ERR_BLOCK_ALREADY_CHECKED))
        (asserts! (>= block-height (+ lastBlock u100)) (err ERR_WAIT_100_BLOCKS_BEFORE_CHECKING))
        (if isWinner
            (begin 
                (map-set Rounds {id: roundId}
                
                    {
                        totalStx: (get totalStx rounds),
                        participantIds: (get participantIds rounds),
                        blocksWon: (unwrap-panic (as-max-len? (append (get blocksWon rounds) roundId) u200)),
                        totalMiaWon: (get totalMiaWon rounds),
                        blockHeight: (get blockHeight rounds),
                        duration: (get duration rounds)
                    }
                )
                (var-set lastBlockChecked (+ lastBlock u1))
                (ok true)
            )
            (ok false)
        )
    )
)

;; can be called after last redeemable block's MIA has been transferred to the contract
;; WILL CHANGE THIS TO BE A SEND-MANY
(define-public (payout-to-participant)
    (let
        (
            (address tx-sender)
            (roundId (var-get lastKnownRoundId))
            (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
            (participantId (unwrap! (get id (map-get? ParticipantToId { participant: address })) (err ERR_ID_NOT_FOUND)))
        )
        (asserts! (is-some (index-of (get participantIds rounds) participantId)) (err ERR_ID_NOT_IN_ROUND))
        (ok (calculate-return participantId))
        ;; (try! (as-contract (ft-transfer? 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-token amount MIA_CONTRACT_ADDRESS tx-sender)))

        ;; (ok true)
    )
)

;;      ////    READ-ONLY    \\\\     ;;

(define-read-only (get-participant (id uint))
    (ok (map-get? Participants { id: id }))
)

(define-read-only (get-participant-id (participant principal))
    (ok (get id (map-get? ParticipantToId { participant: participant })))
)

(define-read-only (get-participant-address (id uint))
    (ok (get participant (map-get? IdToParticipant { id: id })))
)

(define-read-only (get-min-contribution)
    (ok (var-get minContribution))
)

(define-read-only (get-contribution (id uint) (round uint))
    (ok (get amount (map-get? Contributions { id: id, round: round })))
)

(define-read-only (get-current-round-id)
    (ok (var-get lastKnownRoundId))
)

;; in progress
;; if none, return (ok none) [don't unwrap]
;; if valid, return (ok (tuple... )) [requires unwrap]
(define-read-only (get-round (id uint))
    (ok (map-get? Rounds { id: id }))
)

;;   ||||     D E C E N T R A L I S E D .    G L O B A L .    S O V E R E I G N .      ||||

;;                    ||||     S Y V I T A    G U I L D     ||||


;; STUFF THAT CURRENTLY NEEDS AN OPERATOR ADDRESS

;; set-min-contribution
;; mine-many
;; start-round


;; temp clarinet stuff

;; (contract-call? .miamipool start-round)
;; (contract-call? .miamipool get-round u1)
;; (contract-call? .miamipool get-current-round-id)
;; (contract-call? .miamipool get-or-create-participant-id 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
;; (contract-call? .miamipool get-participant u1)
;; (contract-call? .miamipool get-participant-address u1)
;; (contract-call? .miamipool add-funds u1000000 u1)
;; (contract-call? .miamipool withdraw-funds u400000 u1)
;; (contract-call? .miamipool get-contribution u1 u1)
;; (contract-call? .miamipool mine-many (list u1000000 u3000000 u7000000 u6000000 u2000000))