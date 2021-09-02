;; miamipool
;; <add a description here>

;; constants
(define-constant ERR_INVALID_AMOUNT u1000)
;;

;; data maps and vars


;; Current pool members and their contributed STX
(define-map Members
    { address: principal}
	{ amount: uint }
)

;; get-amount(round, address)

(define-data-var minerAddressList (list 1000 principal) (list)) ;; WE NEED THIS TO ITERATE MiningMembers LATER

(define-data-var minContribution uint u0) ;; minimum contribution when adding funds
(define-data-var miningRound uint u1) ;; mining pool round
;;

;; private functions
(define-private (add-to-miner-address-list (address principal))
    (var-set minerAddressList (unwrap-panic (as-max-len? (append (var-get minerAddressList) address) u1000)))
)
;;

;; public functions

(define-public (get-miner-list)
    (ok (var-get minerAddressList))
)

(define-public (add-funds (address principal) (amount uint))
    (begin
        (asserts! (>= amount (var-get minContribution)) (err ERR_INVALID_AMOUNT))

        (if (is-none (map-get? Members { address: address }))
             ;; ADD NEW MEMBER
             (begin
                ;; ADD STX TRANSFER
                (map-insert Members {address: address} {amount: amount})
                (add-to-miner-address-list address)
                (ok true)
             )
             ;; UPDATE FUNDS
             (begin
                (let
                    ;; ADD STX TRANSFER
                    ((currentAmount (get amount (unwrap! (map-get? Members { address: address }) (err u0))) ))
                    (map-set Members {address: address} {amount: (+ currentAmount amount)})

                )
                (ok true)
             )
         )
    )
)

;; is-eq (map-get? Members { round: (var-get round)} { address: address }) none

(define-public (get-member (address principal))
    (ok (map-get? Members { address: address}))
)

(define-public (set-min-contribution (amount uint))
    (begin
        (var-set minContribution amount)
        (ok true)
    )
)
;;

;; SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66
;; (contract-call? .miamipool add-funds 'SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66 u1)