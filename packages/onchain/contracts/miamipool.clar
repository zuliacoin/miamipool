;;    ////  _______ _____ _______ _______ _____  _____   _____   _____          \\\\    ;;
;;          |  |  |   |   |_____| |  |  |   |   |_____] |     | |     | |               ;;
;;    \\\\  |  |  | __|__ |     | |  |  | __|__ |       |_____| |_____| |_____  ////    ;;

;;    ||||      A S T E R I A    X    I N V I D I A    X    D I O P I T I S     ||||

;;          ------------------------------------------------------------------          ;;


;;      ////    ERRORS    \\\\      ;;

;; RBAC (1xx)
(define-constant ERR_INVALID_AMOUNT u100)
(define-constant ERR_ID_NOT_FOUND u101)
(define-constant ERR_ID_NOT_IN_ROUND u102)
(define-constant ERR_INSUFFICIENT_BALANCE u103)

;; Mining (2xx)
(define-constant ERR_CONTRIBUTION_TOO_LOW u200)
(define-constant ERR_ROUND_NOT_FOUND u201)
(define-constant ERR_CANNOT_MINE_IF_ROUND_ACTIVE u202)
(define-constant ERR_CANNOT_MODIFY_FUNDS_OF_EXPIRED_ROUND u203)
(define-constant ERR_MINE_TOTAL_NOT_BALANCE_TOTAL u204)
(define-constant ERR_BLOCK_ALREADY_CHECKED u205)
(define-constant ERR_WAIT_100_BLOCKS_BEFORE_CHECKING u206)
(define-constant ERR_ALL_POSSIBLE_BLOCKS_CHECKED u207)
(define-constant ERR_MUST_REDEEM_ALL_WON_BLOCKS u208)
(define-constant ERR_ALL_PARTICIPANTS_PAID u209)
(define-constant ERR_MINING_NOT_STARTED u210)
(define-constant ERR_ALREADY_MINED u211)
(define-constant ERR_ROUND_HAS_NOT_EXPIRED u212)


(define-data-var participantIdTip uint u0)

;; filter vars
(define-data-var idToRemove uint u0)
(define-data-var roundIdToCheck uint u0)
(define-data-var firstElement uint u0)


(define-data-var lastKnownRoundId uint u0)

;;      ////    CONFIG    \\\\      ;;

(define-data-var minContribution uint u1000000)

(define-data-var feePrincipals (list 3 {principal: principal, percent: uint}) 
    (list
        {principal: 'SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66, percent: u33}
        {principal: 'SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66, percent: u33}
        {principal: 'SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66, percent: u33}
    )
)

(define-data-var fee uint u3)

(define-constant MIA_CONTRACT_ADDRESS (as-contract tx-sender))

;;      ////    STORAGE    \\\\     ;;

;; stores aggregate round data
(define-map Rounds
    { id: uint }
    {
        totalStx: uint,
        participantIds: (list 4096 uint),
        blocksWon: (list 150 uint),
        totalMiaWon: uint,
        blockHeight: uint
    }
)

;; stores progress variables in each round
(define-map RoundsStatus
    { id: uint }
    {
        hasMined: bool,
        lastBlockChecked: uint,
        lastBlockToCheck: uint,
        indexOfBlockToClaim: uint,
        requiredPayouts: uint,
        sendManyIds: (list 200 uint),
    }
)

;; stores all contributions
(define-map Contributions
    { id: uint, round: uint }
	{ amount: uint }
)

;; stores up to last 512 rounds a participant was in
(define-map Participants
    { id: uint }
	{ roundsParticipated: (list 512 uint) }
)

;; lookup table to get principle from id
(define-map IdToPrincipal
    { id: uint }
    { participant: principal}
)

;; lookup table to get id from principle
(define-map PrincipalToId
    { participant: principal}
    { id: uint }
)

;;      ////    PRIVATE    \\\\       ;;
;; returns participant id if it has been created, or creates and returns new ID
(define-private (get-or-create-participant-id (participant principal))
  (match (get id (map-get? PrincipalToId { participant: participant })) participantId
    participantId
    (let
      ((newId (+ u1 (var-get participantIdTip))))
      (map-set Participants {id: newId} {roundsParticipated: (list)})
      (map-set IdToPrincipal {id: newId} {participant: participant})
      (map-set PrincipalToId {participant: participant} {id: newId})
      (var-set participantIdTip newId)
      newId
    )
  )
)


;; FILTERS

(define-private (is-not-first-element (roundId uint))
  (not (is-eq roundId (var-get firstElement)))
)

(define-private (is-not-id (participantId uint))
  (not (is-eq participantId (var-get idToRemove)))
)

(define-private (is-in-next-200-ids (participantId uint))
  (let
    (
        (roundId (var-get roundIdToCheck))
        (rounds (unwrap-panic (map-get? Rounds {id: roundId})))
        (roundsStatus (unwrap-panic (map-get? RoundsStatus {id: roundId})))
        (participantIds (get participantIds rounds))
        (payoutIndexOfIds (* (get requiredPayouts roundsStatus) u200))
        (indexOfId (unwrap-panic (index-of participantIds participantId)))
    )

    (if (and (>= indexOfId payoutIndexOfIds) (< indexOfId payoutIndexOfIds))
        (map-set RoundsStatus {id: roundId}
            {
                hasMined: (get hasMined roundsStatus),
                lastBlockChecked: (get lastBlockChecked roundsStatus),
                lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                indexOfBlockToClaim: (get indexOfBlockToClaim roundsStatus),
                requiredPayouts: (get requiredPayouts roundsStatus),
                sendManyIds: (unwrap-panic (as-max-len? (append (get sendManyIds roundsStatus) participantId) u200))
            }
        )
        false
    )
  )
)

;; maybe done? needs checking
(define-private (calculate-return (participantId uint))
    (let
        (
            (roundId (var-get roundIdToCheck))
            (participant (unwrap-panic (map-get? IdToPrincipal {id: participantId})))
            (totalStx (get totalStx (unwrap-panic 
                (map-get? Rounds { 
                    id: roundId 
                }) 
            )))
            (totalMiaWon (unwrap-panic (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token get-balance MIA_CONTRACT_ADDRESS)))
            
            (contributionAmount (get amount (unwrap-panic 
                (map-get? Contributions { 
                    id: participantId, 
                    round: roundId
                })
            )))
        )
        {to: (get participant participant), memo: none, amount: (* totalMiaWon (/ contributionAmount totalStx))}
    )
)

(define-private (calculate-fee (feePrincipalAndPercent {principal: principal, percent: uint}))
    (let
        ((totalMiaWon (unwrap-panic (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token get-balance MIA_CONTRACT_ADDRESS))))
        {to: (get principal feePrincipalAndPercent), memo: none, amount: (/ (* totalMiaWon (get percent feePrincipalAndPercent)) u100)}
    )
)


(define-private (payout-fee)
    (let
        (
            (payoutFeeList (map calculate-fee (var-get feePrincipals)))
        )
        (begin
            (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token send-many (unwrap-panic (as-max-len? payoutFeeList u200))))   
            (ok true)
        )
    )
)

;; done... i think?
(define-private (is-round-expired (id uint))
    (let
        (
            (round (unwrap-panic (map-get? Rounds { id: id })))
            (blockHeight (get blockHeight round))
            (endBlockHeight (+ blockHeight u150))
        )
        (if (> block-height endBlockHeight)
            true
            false
        )
    )
)

;; done
(define-public (start-round)
    (let 
        (
            (roundId (var-get lastKnownRoundId))
            (roundsStatus (unwrap! (map-get? RoundsStatus {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
            (newRoundKeyTuple { id: (+ roundId u1) })
            (newRoundValueTuple {
                totalStx: u0,
                participantIds: (list),
                blocksWon: (list),
                totalMiaWon: u0,
                blockHeight: block-height
            })
            (newRoundStatusValueTuple {
                hasMined: false,
                lastBlockChecked: u0,
                lastBlockToCheck: u0,
                indexOfBlockToClaim: u0,
                requiredPayouts: u0,
                sendManyIds: (list),
            })
        )

        (begin
            (asserts! (get hasMined roundsStatus) (err ERR_MINING_NOT_STARTED))
            (var-set lastKnownRoundId (+ roundId u1))
            (asserts! (map-insert Rounds newRoundKeyTuple newRoundValueTuple) (err u0))
            (asserts! (map-insert RoundsStatus newRoundKeyTuple newRoundStatusValueTuple) (err u0))
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
            (asserts! (not (is-round-expired roundId)) (err ERR_CANNOT_MODIFY_FUNDS_OF_EXPIRED_ROUND))

            (try! (stx-transfer? amount address MIA_CONTRACT_ADDRESS))
            (match (get amount (map-get? Contributions { id: participantId, round: roundId })) balance
                (map-set Contributions {id: participantId, round: roundId} {amount: (+ balance amount)})
                (map-set Contributions {id: participantId, round: roundId} {amount: amount})
            )

            (map-set Participants {id: participantId}
                {
                    roundsParticipated:
                    (let
                        ((roundsParticipated (get roundsParticipated participant)))
                        (match (index-of roundsParticipated roundId) val
                            roundsParticipated
                            (if (is-eq (len roundsParticipated) u512)
                                (begin
                                    (var-set firstElement (unwrap-panic (element-at roundsParticipated u0)))
                                    (filter is-not-first-element roundsParticipated)
                                    (unwrap-panic (as-max-len? (append roundsParticipated roundId) u512))
                                )
                                (unwrap-panic (as-max-len? (append roundsParticipated roundId) u512))
                            )
                        )
           
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
                    blockHeight: (get blockHeight rounds)
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
                (participantId (unwrap! (get id (map-get? PrincipalToId { participant: tx-sender })) (err ERR_ID_NOT_FOUND)))
                (participant (unwrap-panic (map-get? Participants {id: participantId})))
                (balance (unwrap-panic (get amount (map-get? Contributions { id: participantId, round: roundId }))))
            )
            (asserts! (is-some (index-of (get participantIds rounds) participantId)) (err ERR_ID_NOT_IN_ROUND))
            (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
            (asserts! (<= amount balance) (err ERR_INSUFFICIENT_BALANCE))
            (asserts! (not (is-round-expired roundId)) (err ERR_CANNOT_MODIFY_FUNDS_OF_EXPIRED_ROUND))

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
                    blockHeight: (get blockHeight rounds)
                }
            )
            (ok true)
        )
    )
)

(define-public (mine (roundId uint))
    (begin
        (let
            (
                (roundsStatus (unwrap! (map-get? RoundsStatus {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (hasMined (get hasMined roundsStatus))
            )
            (asserts! (not hasMined) (err ERR_ALREADY_MINED))
            (asserts! (is-round-expired roundId) (err ERR_ROUND_HAS_NOT_EXPIRED))
        )
        (if (< (stx-get-balance MIA_CONTRACT_ADDRESS) u150)
            (map-set RoundsStatus {id: roundId} 
                {
                    hasMined: true,
                    lastBlockChecked: u0,
                    lastBlockToCheck: u0,
                    indexOfBlockToClaim: u0,
                    requiredPayouts: u0,
                    sendManyIds: (list)
                }
            )
            (let
                (
                    (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                    (roundsStatus (unwrap! (map-get? RoundsStatus {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                    (totalStx (get totalStx rounds))
                    (participantIds (get participantIds rounds))
                    (uwu (/ totalStx u150))
                    (miningBlocksList 
                        (list 
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                        )
                    )
                )
                (asserts! (is-round-expired roundId) (err ERR_CANNOT_MINE_IF_ROUND_ACTIVE))
                (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1 mine-many miningBlocksList))
                (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: true,
                        lastBlockChecked: (- block-height u1),
                        lastBlockToCheck: (+ block-height u150),
                        indexOfBlockToClaim: u0,
                        requiredPayouts: u0,
                        sendManyIds: (list)
                    }
                )
            )
        )
        (ok true)
    )
)

(define-public (can-claim-mining-reward (roundId uint))
    (let
        (
            (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
            (roundsStatus (unwrap-panic (map-get? RoundsStatus {id: roundId})))
            (lastBlockChecked (get lastBlockChecked roundsStatus))
            (lastBlockToCheck (get lastBlockToCheck roundsStatus))
            (isWinner (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1 can-claim-mining-reward MIA_CONTRACT_ADDRESS lastBlockChecked))
            
        )
        (asserts! (get hasMined roundsStatus) (err ERR_MINING_NOT_STARTED))
        (asserts! (>= block-height (+ lastBlockChecked u100)) (err ERR_WAIT_100_BLOCKS_BEFORE_CHECKING))
        (asserts! (not (>= block-height lastBlockToCheck)) (err ERR_ALL_POSSIBLE_BLOCKS_CHECKED))

        (if isWinner
            (begin 
                (map-set Rounds {id: roundId}
                
                    {
                        totalStx: (get totalStx rounds),
                        participantIds: (get participantIds rounds),
                        blocksWon: (unwrap-panic (as-max-len? (append (get blocksWon rounds) roundId) u150)),
                        totalMiaWon: (get totalMiaWon rounds),
                        blockHeight: (get blockHeight rounds)
                    }
                )
                (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: (get hasMined roundsStatus),
                        lastBlockChecked: (+ lastBlockChecked u1),
                        lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                        indexOfBlockToClaim: (+ (get indexOfBlockToClaim roundsStatus) u1),
                        requiredPayouts: (get requiredPayouts roundsStatus),
                        sendManyIds: (get sendManyIds roundsStatus)
                    }
                )
                (ok true)
            )
            (ok false)
        )
    )
)

(define-public (claim-mining-reward (roundId uint))
    (begin
        (let
            (
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (roundsStatus (unwrap-panic (map-get? RoundsStatus {id: roundId})))
                (blocksWon (get blocksWon rounds))
                (blockToClaim (unwrap-panic (element-at blocksWon u0)))
                (lastBlockChecked (get lastBlockChecked roundsStatus))
                (lastBlockToCheck (get lastBlockToCheck roundsStatus))
            )
            (asserts! (get hasMined roundsStatus) (err ERR_MINING_NOT_STARTED))
            (asserts! (>= block-height (+ lastBlockChecked u100)) (err ERR_WAIT_100_BLOCKS_BEFORE_CHECKING))
            (asserts! (not (>= block-height lastBlockToCheck)) (err ERR_ALL_POSSIBLE_BLOCKS_CHECKED))
            (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1 claim-mining-reward blockToClaim))

            (map-set RoundsStatus {id: roundId}
                {
                    hasMined: (get hasMined roundsStatus),
                    lastBlockChecked: (get lastBlockChecked roundsStatus),
                    lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                    indexOfBlockToClaim: (+ (get indexOfBlockToClaim roundsStatus) u1),
                    requiredPayouts: (get requiredPayouts roundsStatus),
                    sendManyIds: (get sendManyIds roundsStatus)
                }
            )
        )
        (ok true)
    )
)

;; Will need to be called multiple times in the UI (can payout max 200 participants at a time)
(define-public (payout-mia (roundId uint))
    (begin
        (let
            (
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (roundsStatus (unwrap! (map-get? RoundsStatus {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (blocksWon (get blocksWon rounds))
                (participantIds (get participantIds rounds))
                (requiredPayout (get requiredPayouts roundsStatus))
                (indexOfBlockToClaim (get indexOfBlockToClaim roundsStatus))
                (sendManyIds (get sendManyIds roundsStatus))
            )
            (asserts! (get hasMined roundsStatus) (err ERR_MINING_NOT_STARTED))
            (asserts! (not (is-eq (+ indexOfBlockToClaim u1) (len blocksWon))) (err ERR_MUST_REDEEM_ALL_WON_BLOCKS))
            (asserts! (not (is-eq requiredPayout (+ (/ (len participantIds) u150) u1 ))) (err ERR_ALL_PARTICIPANTS_PAID))
            (asserts! (not (is-eq (+ indexOfBlockToClaim u1) (len blocksWon))) (err ERR_MUST_REDEEM_ALL_WON_BLOCKS))


            ;; ERR IN IF
            (if (is-eq requiredPayout u0)
                (begin
                    (map-set Rounds {id: roundId}
                        {
                            totalStx: (get totalStx rounds),
                            participantIds: (get participantIds rounds),
                            blocksWon: (get blocksWon rounds) ,
                            totalMiaWon: (unwrap-panic (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token get-balance MIA_CONTRACT_ADDRESS)),
                            blockHeight: (get blockHeight rounds)
                        }
                    )
                    (try! (payout-fee))
                    true
                )
                false
            )
            (var-set roundIdToCheck roundId)
            (filter is-in-next-200-ids participantIds)
            (let
                ((sendManyList (map calculate-return sendManyIds)))
                (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token send-many sendManyList))
            )

            (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: (get hasMined roundsStatus),
                        lastBlockChecked: (get lastBlockChecked roundsStatus),
                        lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                        indexOfBlockToClaim: indexOfBlockToClaim,
                        requiredPayouts: (+ requiredPayout u1),
                        sendManyIds: sendManyIds
                    }
            )
        )
        (ok true)
    )
)


;;      ////    READ-ONLY    \\\\     ;;

(define-read-only (get-participant (id uint))
    (ok (map-get? Participants { id: id }))
)

(define-read-only (get-participant-id (participant principal))
    (ok (get id (map-get? PrincipalToId { participant: participant })))
)

(define-read-only (get-participant-address (id uint))
    (ok (get participant (map-get? IdToPrincipal { id: id })))
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

;; (contract-call? .citycoin-auth  initialize-contracts 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1)
;; (contract-call? .citycoin-core-v1 register-user none)
