;;    ////  _______ _____ _______ _______ _____  _____   _____   _____          \\\\    ;;
;;          |  |  |   |   |_____| |  |  |   |   |_____] |     | |     | |               ;;
;;    \\\\  |  |  | __|__ |     | |  |  | __|__ |       |_____| |_____| |_____  ////    ;;

;;    ||||      A S T E R I A    X    I N V I D I A    X    D I O P I T I S     ||||

;;          ------------------------------------------------------------------          ;;


;;      ////    ERRORS    \\\\      ;;

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
(define-constant ERR_MUST_CHECK_ALL_MINED_BLOCKS u212)
(define-constant ERR_INVALID_AMOUNT u213)
(define-constant ERR_ID_NOT_FOUND u214)
(define-constant ERR_ID_NOT_IN_ROUND u215)
(define-constant ERR_INSUFFICIENT_BALANCE u216)

;; filter vars
(define-data-var idToRemove uint u0)
(define-data-var roundIdToCheck uint u0)
(define-data-var firstElement uint u0)
(define-data-var totalCount uint u0)
(define-data-var payoutNum uint u0)
(define-data-var sendManyList (list 200 uint) (list))

(define-data-var participantIdTip uint u0)
(define-data-var lastKnownRoundId uint u0)
(define-data-var incompleteRounds (list 100 uint) (list))


;;      ////    CONFIG    \\\\      ;;

(define-data-var minContribution uint u1000000)

(define-data-var feePrincipals (list 3 {principal: principal, percent: uint}) 
    (list
        {principal: 'SP1FKRSMJADD20VRAZ0FC8EMFZ128GZSF08BEYV86, percent: u55} ;; invidia
        {principal: 'SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66, percent: u25} ;; asteria
        {principal: 'SP3XJTH5TJ3PEE67T02AA4DSBC89A80S028SQS769, percent: u20} ;; dio
    )
)

(define-constant MIA_CONTRACT_ADDRESS (as-contract tx-sender))


;;      ////    STORAGE    \\\\     ;;

;; stores aggregate round data
(define-map Rounds
    { id: uint }
    {
        totalStx: uint,
        participantIds: (list 1024 uint),
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
        hasClaimed: bool,
        hasPaidOut: bool,
        nextBlockToCheck: uint,
        lastBlockToCheck: uint,
        requiredPayouts: uint
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

(define-private (is-not-id (id uint))
  (not (is-eq id (var-get idToRemove)))
)

(define-private (next-16-values (participantId uint)) 
  (let
    (
        (count (var-get totalCount))
        (requiredPayout (var-get payoutNum))
    )

    (if (is-eq requiredPayout u0)
        (if (and (>= count u0) (< count u16))
            (var-set sendManyList (unwrap-panic (as-max-len? (append (var-get sendManyList) participantId) u16)))
            false
        )
        (if (and (>= count (* requiredPayout u16)) (< count (* (+ requiredPayout u1) u16)))
            (var-set sendManyList (unwrap-panic (as-max-len? (append (var-get sendManyList) participantId) u16)))
            false
        )
    )

    (var-set totalCount (+ count u1))
  )
)

(define-private (calculate-return (participantId uint))
    (let
        (
            (roundId (var-get roundIdToCheck))
            (round (unwrap-panic (map-get? Rounds { id: roundId })))
            (participant (unwrap-panic (map-get? IdToPrincipal {id: participantId})))
            (totalStx (get totalStx round))
            (totalMiaWon (get totalMiaWon round))
            (contributionAmount (get amount (unwrap-panic 
                (map-get? Contributions { 
                    id: participantId, 
                    round: roundId
                })
            )))
        )

        {to: (get participant participant), memo: none, amount: (/ (* (* (/ totalMiaWon u100) u97) contributionAmount) totalStx) }
    )
)

(define-private (calculate-fee (feePrincipalAndPercent {principal: principal, percent: uint}))
    (let
        (
            (roundId (var-get roundIdToCheck))
            (round (unwrap-panic (map-get? Rounds { id: roundId })))
            (totalMiaWon (get totalMiaWon round))
            (percent (get percent feePrincipalAndPercent))
        )
        {to: (get principal feePrincipalAndPercent), memo: none, amount: (* percent (/ (* (/ totalMiaWon u100) u3) u100))}
    )
)

(define-private (payout-fee)
    (let
        (
            (payoutFeeList (map calculate-fee (var-get feePrincipals)))
        )
        (begin
            (try! (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token send-many (unwrap-panic (as-max-len? payoutFeeList u3)))))   
            (ok true)
        )
    )
)

(define-private (is-round-expired (id uint))
    (let
        (
            (round (unwrap-panic (map-get? Rounds { id: id })))
            (blockHeight (get blockHeight round))
            (endBlockHeight (+ blockHeight u15))
        )
        (if (> block-height endBlockHeight)
            true
            false
        )
    )
)

(define-private (start-round)
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
                hasClaimed: false,
                hasPaidOut: false,
                nextBlockToCheck: u0,
                lastBlockToCheck: u0,
                requiredPayouts: u0
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


;;      ////    PUBLIC    \\\\       ;;

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
                        (unwrap-panic (as-max-len? (append (get participantIds rounds) participantId) u1024))
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
                (min (var-get minContribution))
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
                    (if (< (- balance amount) min)
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
                    (if (< (- balance amount) min)
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
        
        (if (< (get totalStx (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND))) u1500000)
            (begin
                (asserts! (map-set RoundsStatus {id: roundId} 
                    {
                        hasMined: true,
                        hasClaimed: true,
                        hasPaidOut: true,
                        nextBlockToCheck: u1,
                        lastBlockToCheck: u0,
                        requiredPayouts: u0
                    }
                ) (err u0))
                (start-round)
            )

            (let
                (
                    (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                    (roundsStatus (unwrap! (map-get? RoundsStatus {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                    (totalStx (get totalStx rounds))
                    (participantIds (get participantIds rounds))
                    (uwu (/ totalStx u15))
                    (miningBlocksList 
                        (list 
                            uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu uwu
                        )
                    )
                )
                (try! (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1 mine-many miningBlocksList)))
                (asserts! (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: true,
                        hasClaimed: false,
                        hasPaidOut: false,
                        nextBlockToCheck: block-height,
                        lastBlockToCheck: (- (+ block-height u15) u1),
                        requiredPayouts: u0
                    }
                ) (err u0))
                (var-set incompleteRounds (unwrap-panic (as-max-len? (append (var-get incompleteRounds) roundId) u100)))
                (start-round)
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
        (asserts! (> block-height (+ nextBlockToCheck u10)) (err ERR_WAIT_100_BLOCKS_BEFORE_CHECKING))
        (asserts! (not (get hasClaimed roundsStatus)) (err ERR_ALL_POSSIBLE_BLOCKS_CHECKED))

        (if isWinner
            (begin 
                (try! (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1 claim-mining-reward nextBlockToCheck)))
                (asserts! (map-set Rounds {id: roundId}
                    {
                        totalStx: (get totalStx rounds),
                        participantIds: (get participantIds rounds),
                        blocksWon: (unwrap-panic (as-max-len? (append (get blocksWon rounds) nextBlockToCheck) u15)),
                        totalMiaWon: (+ (get totalMiaWon rounds) (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1 get-coinbase-amount nextBlockToCheck))),
                        blockHeight: (get blockHeight rounds)
                    }
                ) (err u0))
                
                (asserts! (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: (get hasMined roundsStatus),
                        hasClaimed: (if (is-eq nextBlockToCheck lastBlockToCheck) true false),
                        hasPaidOut: false,
                        nextBlockToCheck: (+ nextBlockToCheck u1),
                        lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                        requiredPayouts: (get requiredPayouts roundsStatus)
                    }
                ) (err u0))
                (ok isWinner)
            )
            (begin
                (asserts! (map-set RoundsStatus {id: roundId}
                    {
                        hasMined: (get hasMined roundsStatus),
                        hasClaimed: (if (is-eq nextBlockToCheck lastBlockToCheck) true false),
                        hasPaidOut: false,
                        nextBlockToCheck: (+ nextBlockToCheck u1),
                        lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                        requiredPayouts: (get requiredPayouts roundsStatus)
                    }
                ) (err u0))
                (ok isWinner)
            )
        )
    )
)

(define-public (payout-mia (roundId uint))
    (begin
        (let
            (
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (roundsStatus (unwrap! (map-get? RoundsStatus {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (blocksWon (get blocksWon rounds))
                (participantIds (get participantIds rounds))
                (totalMia (get totalMiaWon rounds))
                (requiredPayout (get requiredPayouts roundsStatus))
            )

            (asserts! (get hasMined roundsStatus) (err ERR_MINING_NOT_STARTED))
            (asserts! (get hasClaimed roundsStatus) (err ERR_MUST_CHECK_ALL_MINED_BLOCKS))
            (asserts! (not (get hasPaidOut roundsStatus)) (err ERR_ALL_PARTICIPANTS_PAID))

            (var-set sendManyList (list))

            (if (is-eq totalMia u0)
                (asserts! (map-set RoundsStatus {id: roundId}
                {
                    hasMined: (get hasMined roundsStatus),
                    hasClaimed: (get hasClaimed roundsStatus),
                    hasPaidOut: (begin
                                    (var-set idToRemove roundId)
                                    (var-set incompleteRounds (filter is-not-id (var-get incompleteRounds)))
                                    true
                                ),
                    nextBlockToCheck: (get nextBlockToCheck roundsStatus),
                    lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                    requiredPayouts: u0
                }
                ) (err u0))
                (begin
                    (var-set roundIdToCheck roundId)
                    (if (is-eq requiredPayout u0) (try! (payout-fee)) false)
                    
                    (var-set payoutNum requiredPayout)
                    (var-set totalCount u0)
                    (filter next-16-values participantIds)

                    (try! (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token send-many (map calculate-return (var-get sendManyList)))))
                    
                    (asserts! (map-set RoundsStatus {id: roundId}
                        {
                            hasMined: (get hasMined roundsStatus),
                            hasClaimed: (get hasClaimed roundsStatus),
                            hasPaidOut: 
                                (if (is-eq (/ (len participantIds) u16) u0)
                                    (begin
                                        (var-set idToRemove roundId)
                                        (var-set incompleteRounds (filter is-not-id (var-get incompleteRounds)))
                                        true
                                    )
                                    (if (is-eq requiredPayout (/ (len participantIds) u16))
                                        (begin
                                                (var-set idToRemove roundId)
                                                (var-set incompleteRounds (filter is-not-id (var-get incompleteRounds)))
                                                true
                                        ) 
                                        false
                                    )
                                ),
                            nextBlockToCheck: (get nextBlockToCheck roundsStatus),
                            lastBlockToCheck: (get lastBlockToCheck roundsStatus),
                            requiredPayouts: (+ requiredPayout u1)
                        }
                    ) (err u0))
                )
            )
           (ok (var-get sendManyList))    
        )
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
    (let
        ((rounds (unwrap! (map-get? Rounds {id: id}) (err ERR_ROUND_NOT_FOUND))))
        (ok 
            {
                totalStx: (get totalStx rounds),
                participantIds: (get participantIds rounds),
                blocksWon: (get blocksWon rounds),
                totalMiaWon: (get totalMiaWon rounds),
                blockHeight: (get blockHeight rounds),
                participantAddresses: (map id-to-principal (get participantIds rounds))
            }
        )
    )
)

(define-read-only (get-round-and-status (id uint))
    (ok
        {
            round: (unwrap-panic (map-get? Rounds { id: id })),
            roundsStatus: (unwrap-panic (map-get? RoundsStatus { id: id }))   
        }
    )
)

(define-read-only (get-round-status (id uint))
    (ok (unwrap! (map-get? RoundsStatus { id: id }) (err ERR_ROUND_NOT_FOUND)))
)

(define-read-only (get-mia-balance)
    (ok (unwrap-panic (as-contract (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-token get-balance MIA_CONTRACT_ADDRESS))))
)

(define-read-only (get-stx-balance)
    (ok (stx-get-balance MIA_CONTRACT_ADDRESS))
)

(define-read-only (get-incomplete-rounds)
    (ok (var-get incompleteRounds))
)

(start-round)

;;   ||||     D E C E N T R A L I S E D .    G L O B A L .    S O V E R E I G N .      ||||

;;                    ||||     S Y V I T A    G U I L D     ||||