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
(define-constant ERR_CANNOT_MODIFY_FUNDS_OF_EXPIRED_ROUND u203)
(define-constant ERR_MINE_TOTAL_NOT_BALANCE_TOTAL u204)
(define-constant ERR_BLOCK_ALREADY_CHECKED u205)
(define-constant ERR_WAIT_100_BLOCKS_BEFORE_CHECKING u206)
(define-constant ERR_ALL_POSSIBLE_BLOCKS_CHECKED u207)
(define-constant ERR_MUST_REDEEM_ALL_WON_BLOCKS u208)
(define-constant ERR_ALL_PARTICIPANTS_PAID u209)
(define-constant ERR_MINING_NOT_STARTED u210)
(define-constant ERR_ALREADY_MINED u211)

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
        {principal: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, percent: u50}
        {principal: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG, percent: u30}
        {principal: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC, percent: u20}
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
        nextBlockToCheck: uint,
        lastBlockToCheck: uint,
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
(define-map ParticipantsRoundHistory
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
      (map-set ParticipantsRoundHistory {id: newId} {roundsParticipated: (list)})
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

    (if (and (>= indexOfId (* payoutIndexOfIds u200)) (< indexOfId (+ (* payoutIndexOfIds u200) u200)))
        (map-set RoundsStatus {id: roundId}
            {
                hasMined: (get hasMined roundsStatus),
                nextBlockToCheck: (get nextBlockToCheck roundsStatus),
                lastBlockToCheck: (get lastBlockToCheck roundsStatus),
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
            (totalMiaWon (unwrap-panic (as-contract 
            (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token get-balance MIA_CONTRACT_ADDRESS)
            )))
            (contributionAmount (get amount (unwrap-panic 
                (map-get? Contributions { 
                    id: participantId, 
                    round: roundId
                })
            )))
        )
        (/ contributionAmount totalStx)
        {to: (get participant participant), memo: none, amount: (/ (* totalMiaWon contributionAmount) totalStx) }

    )
)

(define-private (calculate-fee (feePrincipalAndPercent {principal: principal, percent: uint}))
    (let
        (
            (totalMiaWon (unwrap-panic (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token get-balance MIA_CONTRACT_ADDRESS))))
            (percent (get percent feePrincipalAndPercent))
        )
        {to: (get principal feePrincipalAndPercent), memo: none, amount: (* percent (/ (* (/ totalMiaWon u100) u2) u100))}
    )
)

(define-private (payout-fee)
    (let
        (
            (payoutFeeList (map calculate-fee (var-get feePrincipals)))
        )
        (begin
            (try! (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token send-many (unwrap-panic (as-max-len? payoutFeeList u200)))))   
            (ok true)
        )
    )
)
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
                nextBlockToCheck: u0,
                lastBlockToCheck: u0,
                requiredPayouts: u0,
                sendManyIds: (list),
            })
        )
        (if (is-eq roundId u0)
            false
            (asserts! (get hasMined (unwrap! (map-get? RoundsStatus {id: roundId}) (err ERR_ROUND_NOT_FOUND))) (err ERR_MINING_NOT_STARTED))
        )
        (var-set lastKnownRoundId (+ roundId u1))
        (asserts! (map-insert Rounds newRoundKeyTuple newRoundValueTuple) (err u0))
        (asserts! (map-insert RoundsStatus newRoundKeyTuple newRoundStatusValueTuple) (err u0))
        (ok true)  
    )      
)

(define-public (add-funds (amount uint))
    (begin
        (let
            (
                (address tx-sender)
                (roundId (var-get lastKnownRoundId))
                (participantId (get-or-create-participant-id address))
                (participant (unwrap-panic (map-get? ParticipantsRoundHistory {id: participantId})))
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
            )

            (asserts! (>= amount (var-get minContribution)) (err ERR_CONTRIBUTION_TOO_LOW))
            (asserts! (not (is-round-expired roundId)) (err ERR_CANNOT_MODIFY_FUNDS_OF_EXPIRED_ROUND))

            (try! (stx-transfer? amount address MIA_CONTRACT_ADDRESS))
            (match (get amount (map-get? Contributions { id: participantId, round: roundId })) balance
                (asserts! (map-set Contributions {id: participantId, round: roundId} {amount: (+ balance amount)}) (err u0))
                (asserts! (map-set Contributions {id: participantId, round: roundId} {amount: amount}) (err u0))
            )

            (asserts! (map-set ParticipantsRoundHistory {id: participantId}
                {
                    roundsParticipated:
                    (let
                        ((roundsParticipated (get roundsParticipated participant)))
                        (match (index-of roundsParticipated roundId) val
                            roundsParticipated
                            (if (is-eq (len roundsParticipated) u512)
                                (begin
                                    (var-set firstElement (unwrap-panic (element-at roundsParticipated u0)))
                                    (unwrap-panic (as-max-len? (append (filter is-not-first-element roundsParticipated) roundId) u512))
                                )
                                (unwrap-panic (as-max-len? (append roundsParticipated roundId) u512))
                            )
                        )
           
                    )                  
                }
            ) (err u0))
            (asserts! (map-set Rounds {id: roundId}
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
            ) (err u0))
            (ok true)
        )
    )
)

(define-public (withdraw-funds (amount uint))
    (begin
        (let
            (
                (address tx-sender)
                (roundId (var-get lastKnownRoundId))
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (participantId (unwrap! (get id (map-get? PrincipalToId { participant: address })) (err ERR_ID_NOT_FOUND)))
                (participant (unwrap-panic (map-get? ParticipantsRoundHistory {id: participantId})))
                (balance (unwrap-panic (get amount (map-get? Contributions { id: participantId, round: roundId }))))
            )
            (asserts! (is-some (index-of (get participantIds rounds) participantId)) (err ERR_ID_NOT_IN_ROUND))
            (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
            (asserts! (<= amount balance) (err ERR_INSUFFICIENT_BALANCE))
            (asserts! (not (is-round-expired roundId)) (err ERR_CANNOT_MODIFY_FUNDS_OF_EXPIRED_ROUND))

            (try! (as-contract (stx-transfer? amount MIA_CONTRACT_ADDRESS address)))

            (asserts! (map-set Contributions {id: participantId, round: roundId} {amount: (- balance amount)}) (err u0))
            (asserts! (map-set ParticipantsRoundHistory {id: participantId}
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
            ) (err u0))
            (asserts! (map-set Rounds {id: roundId}
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
            ) (err u0))
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
            (asserts! (is-round-expired roundId) (err ERR_CANNOT_MINE_IF_ROUND_ACTIVE))
        )
        (if (< (stx-get-balance MIA_CONTRACT_ADDRESS) u1500000)
            (begin
                (asserts! (map-set RoundsStatus {id: roundId} 
                    {
                        hasMined: true,
                        nextBlockToCheck: u1,
                        lastBlockToCheck: u0,
                        requiredPayouts: u0,
                        sendManyIds: (list)
                    }
                ) (err u0))
                (ok (start-round))
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
                (try! (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1 mine-many miningBlocksList)))
                (asserts! (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: true,
                        nextBlockToCheck: block-height,
                        lastBlockToCheck: (- (+ block-height u150) u1),
                        requiredPayouts: u0,
                        sendManyIds: (list)
                    }
                ) (err u0))
                (ok (start-round))
            )
        )
    )
)

(define-public (claim-mining-reward (roundId uint))
    (let
        (
            (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
            (roundsStatus (unwrap-panic (map-get? RoundsStatus {id: roundId})))
            (nextBlockToCheck (get nextBlockToCheck roundsStatus))
            (lastBlockToCheck (get lastBlockToCheck roundsStatus))
            (isWinner (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1 can-claim-mining-reward MIA_CONTRACT_ADDRESS nextBlockToCheck)))
            
        )
        (asserts! (get hasMined roundsStatus) (err ERR_MINING_NOT_STARTED))
        (asserts! (> block-height (+ nextBlockToCheck u100)) (err ERR_WAIT_100_BLOCKS_BEFORE_CHECKING))
        (asserts! (not (> nextBlockToCheck lastBlockToCheck)) (err ERR_ALL_POSSIBLE_BLOCKS_CHECKED))

        (if isWinner
            (begin 
                (try! (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1 claim-mining-reward nextBlockToCheck)))
                (asserts! (map-set Rounds {id: roundId}
                
                    {
                        totalStx: (get totalStx rounds),
                        participantIds: (get participantIds rounds),
                        blocksWon: (unwrap-panic (as-max-len? (append (get blocksWon rounds) nextBlockToCheck) u150)),
                        totalMiaWon: (unwrap-panic (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token get-balance MIA_CONTRACT_ADDRESS))),
                        blockHeight: (get blockHeight rounds)
                    }
                ) (err u0))
                (asserts! (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: (get hasMined roundsStatus),
                        nextBlockToCheck: (+ nextBlockToCheck u1),
                        lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                        requiredPayouts: (get requiredPayouts roundsStatus),
                        sendManyIds: (get sendManyIds roundsStatus)
                    }
                ) (err u0))
                (ok isWinner)
            )
            (begin
                (asserts! (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: (get hasMined roundsStatus),
                        nextBlockToCheck: (+ nextBlockToCheck u1),
                        lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                        requiredPayouts: (get requiredPayouts roundsStatus),
                        sendManyIds: (get sendManyIds roundsStatus)
                    }
                ) (err u0))
                (ok isWinner)
            )
        
        )
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
            )
            (asserts! (get hasMined roundsStatus) (err ERR_MINING_NOT_STARTED))
            (asserts! (not (is-eq requiredPayout (+ (/ (len participantIds) u150) u1 ))) (err ERR_ALL_PARTICIPANTS_PAID))


            ;; ERR IN IF
            (if (is-eq requiredPayout u0)
                (try! (payout-fee))
                false
            )
            (var-set roundIdToCheck roundId)
            (filter is-in-next-200-ids participantIds)
            (let
                (
                    (sendManyIds (get sendManyIds (unwrap! (map-get? RoundsStatus {id: roundId}) (err ERR_ROUND_NOT_FOUND))))
                    (sendManyList (map calculate-return sendManyIds))
                )
                (try! (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token send-many sendManyList)))
                (asserts! (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: (get hasMined roundsStatus),

                        nextBlockToCheck: (get nextBlockToCheck roundsStatus),
                        lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                        requiredPayouts: (+ requiredPayout u1),
                        sendManyIds: sendManyIds
                    }
                 ) (err u0))
            )
        )
        (ok true)
    )
)


;;      ////    READ-ONLY    \\\\     ;;

(define-read-only (get-participant-round-history (id uint))
    (ok (unwrap-panic (map-get? ParticipantsRoundHistory { id: id })))
)

(define-read-only (principal-to-id (participant principal))
    (ok (unwrap-panic (get id (map-get? PrincipalToId { participant: participant }))))
)

(define-read-only (id-to-principal (id uint))
    (ok (unwrap-panic (get participant (map-get? IdToPrincipal { id: id }))))
)

(define-read-only (get-min-contribution)
    (ok (var-get minContribution))
)

(define-read-only (get-contribution (id uint) (round uint))
    (ok (unwrap-panic (get amount (map-get? Contributions { id: id, round: round }))))
)

(define-read-only (get-current-round-id)
    (ok (var-get lastKnownRoundId))
)

(define-read-only (get-round (id uint))
    (ok (unwrap! (map-get? Rounds { id: id }) (err ERR_ROUND_NOT_FOUND)))
)

(define-read-only (get-round-status (id uint))
    (ok (unwrap! (map-get? RoundsStatus { id: id }) (err ERR_ROUND_NOT_FOUND)))
)

(define-read-only (get-mia-balance)
    (ok (unwrap-panic (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token get-balance MIA_CONTRACT_ADDRESS))))
)

;;   ||||     D E C E N T R A L I S E D .    G L O B A L .    S O V E R E I G N .      ||||

;;                    ||||     S Y V I T A    G U I L D     ||||

;; (contract-call? .citycoin-auth  initialize-contracts 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1)
;; (contract-call? .citycoin-core-v1 register-user none)
;; (contract-call? .miamipool start-round)
;; (contract-call? .miamipool get-round u1)
;; (contract-call? .miamipool add-funds u10000000)
;; (contract-call? .miamipool withdraw-funds u5000000)