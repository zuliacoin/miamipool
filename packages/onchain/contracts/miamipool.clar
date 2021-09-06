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



(define-data-var participantIdTip uint u0)

;; filter vars
(define-data-var idToRemove uint u0)

(define-data-var lastKnownRoundId  uint u0)

(define-data-var lastBlockChecked uint u0)
(define-data-var lastBlockToCheck uint u0)
(define-data-var indexOfBlockToClaim uint u0)
(define-data-var requiredPayouts uint u0)
(define-data-var sendManyIds (list 200 uint) (list))

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


;; FILTERS

(define-private (is-not-id (participantId uint))
  (not (is-eq participantId (var-get idToRemove)))
)

(define-private (is-in-next-200-ids (id uint))
  (let
    (
        (roundId (var-get lastKnownRoundId))
        (rounds (unwrap-panic (map-get? Rounds {id: roundId})))
        (participantIds (get participantIds rounds))
        (payoutIndexOfIds (* (var-get requiredPayouts) u200))
        (indexOfId (unwrap-panic (index-of participantIds id)))
    )

    (if (and (>= indexOfId payoutIndexOfIds) (< indexOfId payoutIndexOfIds))  
        (var-set sendManyIds (unwrap-panic (as-max-len? (append (var-get sendManyIds) id) u200)))
        false
    )
  )
)

;; maybe done? needs checking
(define-private (calculate-return (id uint))
    (let
        (
            (roundId (var-get lastKnownRoundId ))
            (participant (unwrap-panic (map-get? IdToParticipant {id: id})))
            (totalStx (get totalStx (unwrap-panic 
                (map-get? Rounds { 
                    id: roundId 
                }) 
            )))
            (totalMiaWon u1) ;;(ft-get-balance citycoin-token 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-core-v4))
            (contributionAmount (get amount (unwrap-panic 
                (map-get? Contributions { 
                    id: id, 
                    round: roundId
                })
            )))
        )
        {to: participant,  amount: (* totalMiaWon (/ contributionAmount totalStx))}
    )
)


(define-private (payout-fee)
    (let
        ((payoutFeeList (map calculate-fee (var-get feePrincipals))))
        true ;;(try! (contract-call? 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-token send-many payoutFeeList))
    )
)

(define-private (calculate-fee (feePrincipalAndPercent {principal: principal, percent: uint}))
    (let
        ((totalMiaWon u1 ));;(ft-get-balance citycoin-token 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-core-v4))
        {to: (get principal feePrincipalAndPercent),  amount: (/ (* totalMiaWon (get percent feePrincipalAndPercent)) u100)}
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

        ;; ONLY >= FOR TESTING, CHANGE BACK TO >
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
            (newRoundId (+ (var-get lastKnownRoundId) u1))
            (newRoundKeyTuple { id: newRoundId })
            (newRoundValueTuple {
                totalStx: u0,
                participantIds: (list),
                blocksWon: (list),
                totalMiaWon: u0,
                blockHeight: block-height
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
            (asserts! (not (is-round-expired roundId)) (err ERR_CANNOT_MODIFY_FUNDS_OF_EXPIRED_ROUND))

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
                (participantId (unwrap! (get id (map-get? ParticipantToId { participant: tx-sender })) (err ERR_ID_NOT_FOUND)))
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

;; add operator auth to this
(define-public (mine-many (amounts (list 150 uint)))
    (begin
        (let
            (
                (roundId (var-get lastKnownRoundId))
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (totalStx (get totalStx rounds))
                (participantIds (get participantIds rounds))
            )
            (asserts! (is-round-expired roundId) (err ERR_CANNOT_MINE_IF_ROUND_ACTIVE))
            (asserts! (is-eq (fold + amounts u0) totalStx) (err ERR_MINE_TOTAL_NOT_BALANCE_TOTAL))
            ;; (try! (contract-call? 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-core-v4 mine-many amounts))
            (var-set lastBlockChecked (- block-height u1))
            (var-set lastBlockToCheck (+ block-height (len amounts) u100))
            (var-set indexOfBlockToClaim u0)
            (var-set requiredPayouts u0)
            (var-set sendManyIds (list))
        )
        
        (ok true)
    )
)

(define-public (claim-mining-reward)
    (begin
        (let
            (
                (roundId (var-get lastKnownRoundId))
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (blocksWon (get blocksWon rounds))
                (blockToClaim (element-at blocksWon u0))
                (lastBlock (var-get lastBlockChecked))
            )
            (asserts! (>= block-height (+ lastBlock u100)) (err ERR_WAIT_100_BLOCKS_BEFORE_CHECKING))
            (asserts! (not (>= block-height (var-get lastBlockToCheck))) (err ERR_ALL_POSSIBLE_BLOCKS_CHECKED))
            ;;(try! (contract-call? 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-core-v4 claim-mining-reward blockToClaim))
            (var-set indexOfBlockToClaim (+ (var-get indexOfBlockToClaim) u1))
        )
        (ok true)
    )
)

(define-public (can-claim-mining-reward)
    (let
        (
            (roundId (var-get lastKnownRoundId))
            (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
            (lastBlock (var-get lastBlockChecked))
            ;; (isWinner (contract-call? 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-core-v4 can-claim-mining-reward MIA_CONTRACT_ADDRESS lastBlockChecked))
            (isWinner true)
            
        )
        (asserts! (>= block-height (+ lastBlock u100)) (err ERR_WAIT_100_BLOCKS_BEFORE_CHECKING))
        (asserts! (not (>= block-height (var-get lastBlockToCheck))) (err ERR_ALL_POSSIBLE_BLOCKS_CHECKED))

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
                (var-set lastBlockChecked (+ lastBlock u1))
                (ok true)
            )
            (ok false)
        )
    )
)

;; Will need to be called multiple times in the UI (can payout max 200 participants at a time)
(define-public (payout-mia)
    (begin
        (let
            (
                (roundId (var-get lastKnownRoundId))
                (rounds (unwrap! (map-get? Rounds {id: roundId}) (err ERR_ROUND_NOT_FOUND)))
                (blocksWon (get blocksWon rounds))
                (participantIds (get participantIds rounds))
                (requiredPayout (var-get requiredPayouts))
            )
            (asserts! (not (is-eq (+ (var-get indexOfBlockToClaim) u1) (len blocksWon))) (err ERR_MUST_REDEEM_ALL_WON_BLOCKS))
            (asserts! (not (is-eq requiredPayout (+ (/ (len participantIds) u150) u1 ))) (err ERR_ALL_PARTICIPANTS_PAID))
            (asserts! (not (is-eq (+ (var-get indexOfBlockToClaim) u1) (len blocksWon))) (err ERR_MUST_REDEEM_ALL_WON_BLOCKS))

            (if (is-eq requiredPayout u0)
                (begin
                    (map-set Rounds {id: roundId}
                        {
                            totalStx: (get totalStx rounds),
                            participantIds: (get participantIds rounds),
                            blocksWon: (get blocksWon rounds) ,
                            totalMiaWon: (get totalMiaWon rounds), ;;(ft-get-balance citycoin-token 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-core-v4),
                            blockHeight: (get blockHeight rounds)
                        }
                    )
                    (payout-fee)
                )
                false
            )
            (filter is-in-next-200-ids participantIds)
            (let
                ((sendManyList (map calculate-return (var-get sendManyIds))))
                true ;;(try! (contract-call? 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A.citycoin-token send-many sendManyList))
            )

            (var-set requiredPayouts (+ requiredPayout u1))

            ;; FEE PAYOUT

            ;; POOL PAYOUT
        )
        (ok true)
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
