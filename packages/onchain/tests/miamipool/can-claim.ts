import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types,
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts'
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts'

export async function claimBeforeMining() {
    Clarinet.test({
        name: 'If claim-mining-reward is called before mining has started, it fails.',
        async fn(chain: Chain, accounts: Map<string, Account>) {
            let wallet_1 = accounts.get('wallet_1')!

            let block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'start-round',
                    [],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'claim-mining-reward',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])
            block.receipts[1].result.expectErr().expectUint(210)
        },
    })
}

export async function claimBeforeMaturity() {
    Clarinet.test({
        name: 'If claim-mining-reward is called before waiting 100 blocks after mine was called, it fails.',
        async fn(chain: Chain, accounts: Map<string, Account>) {
            let deployer = accounts.get('deployer')!
            let wallet_1 = accounts.get('wallet_1')!

            let block = chain.mineBlock([
                Tx.contractCall(
                    'citycoin-auth',
                    'initialize-contracts',
                    [
                        types.principal(
                            'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1'
                        ),
                    ],
                    deployer.address
                ),
                Tx.contractCall(
                    'citycoin-core-v1',
                    'register-user',
                    [types.none()],
                    deployer.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'start-round',
                    [],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(2000000)],
                    wallet_1.address
                ),
            ])

            // skip 150 blocks
            for (let i = 0; i < 150; i++) {
                chain.mineBlock([])
            }

            block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'mine',
                    [types.uint(1)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round-status',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])
            for (let i = 0; i < 98; i++) {
                chain.mineBlock([])
            }

            block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'claim-mining-reward',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])

            block.receipts[0].result.expectErr().expectUint(206)
        },
    })
}

export async function claimWithoutEnoughStx() {
    Clarinet.test({
        name: "If claim-mining-reward is called for a round that didn't mine due to not enough STX raised, it fails.",
        async fn(chain: Chain, accounts: Map<string, Account>) {
            let deployer = accounts.get('deployer')!
            let wallet_1 = accounts.get('wallet_1')!

            let block = chain.mineBlock([
                Tx.contractCall(
                    'citycoin-auth',
                    'initialize-contracts',
                    [
                        types.principal(
                            'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1'
                        ),
                    ],
                    deployer.address
                ),
                Tx.contractCall(
                    'citycoin-core-v1',
                    'register-user',
                    [types.none()],
                    deployer.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'start-round',
                    [],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(1499999)],
                    wallet_1.address
                ),
            ])

            // skip 150 blocks
            for (let i = 0; i < 150; i++) {
                chain.mineBlock([])
            }

            block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'mine',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])

            // skip 100 blocks
            for (let i = 0; i < 100; i++) {
                chain.mineBlock([])
            }

            block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'get-round-status',
                    [types.uint(1)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'claim-mining-reward',
                    [types.uint(1)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round',
                    [types.uint(1)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round-status',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])
            block.receipts[1].result.expectErr().expectUint(207)
        },
    })
}

export async function claimOnClaimableBlock() {
    Clarinet.test({
        name: 'If claim-mining-reward is called and can-claim returns true, we store the block won, redeem it and increase totalMiaWon.',
        async fn(chain: Chain, accounts: Map<string, Account>) {
            let deployer = accounts.get('deployer')!
            let wallet_1 = accounts.get('wallet_1')!
            let wallet_2 = accounts.get('wallet_2')!
            let wallet_3 = accounts.get('wallet_3')!
            let wallet_4 = accounts.get('wallet_4')!
            let wallet_5 = accounts.get('wallet_5')!
            let wallet_6 = accounts.get('wallet_6')!
            let wallet_7 = accounts.get('wallet_7')!
            let wallet_8 = accounts.get('wallet_8')!
            let wallet_9 = accounts.get('wallet_9')!

            let block = chain.mineBlock([
                Tx.contractCall(
                    'citycoin-auth',
                    'initialize-contracts',
                    [
                        types.principal(
                            'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1'
                        ),
                    ],
                    deployer.address
                ),
                Tx.contractCall(
                    'citycoin-core-v1',
                    'register-user',
                    [types.none()],
                    deployer.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'start-round',
                    [],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(1000000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(2000000)],
                    wallet_2.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(3000000)],
                    wallet_3.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(4000000)],
                    wallet_4.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(5000000)],
                    wallet_5.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(6000000)],
                    wallet_6.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(7000000)],
                    wallet_7.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(8000000)],
                    wallet_8.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(9000000)],
                    wallet_9.address
                ),
            ])

            // skip 150 blocks
            for (let i = 0; i < 150; i++) {
                chain.mineBlock([])
            }

            block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'mine',
                    [types.uint(1)],
                    wallet_9.address
                ),
            ])

            // skip 100 blocks
            for (let i = 0; i < 100; i++) {
                chain.mineBlock([])
            }

            block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'get-round-status',
                    [types.uint(1)],
                    wallet_9.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'claim-mining-reward',
                    [types.uint(1)],
                    wallet_9.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round',
                    [types.uint(1)],
                    wallet_9.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round-status',
                    [types.uint(1)],
                    wallet_9.address
                ),
            ])

            assertEquals(
                block.receipts[2].result,
                '(ok {blockHeight: u1, blocksWon: [u152], participantIds: [u1, u2, u3, u4, u5, u6, u7, u8, u9], totalMiaWon: u250000, totalStx: u45000000})'
            )
            assertEquals(
                block.receipts[3].result,
                '(ok {hasMined: true, lastBlockToCheck: u301, nextBlockToCheck: u153, requiredPayouts: u0, sendManyIds: []})'
            )
        },
    })
}

export async function claimAfterAllChecked() {
    Clarinet.test({
        name: 'If claim-mining-reward is called after all blocks have already been checked, it fails',
        async fn(chain: Chain, accounts: Map<string, Account>) {
            let deployer = accounts.get('deployer')!
            let wallet_1 = accounts.get('wallet_1')!
            let wallet_2 = accounts.get('wallet_2')!
            let wallet_3 = accounts.get('wallet_3')!
            let wallet_4 = accounts.get('wallet_4')!
            let wallet_5 = accounts.get('wallet_5')!
            let wallet_6 = accounts.get('wallet_6')!
            let wallet_7 = accounts.get('wallet_7')!
            let wallet_8 = accounts.get('wallet_8')!
            let wallet_9 = accounts.get('wallet_9')!

            let block = chain.mineBlock([
                Tx.contractCall(
                    'citycoin-auth',
                    'initialize-contracts',
                    [
                        types.principal(
                            'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1'
                        ),
                    ],
                    deployer.address
                ),
                Tx.contractCall(
                    'citycoin-core-v1',
                    'register-user',
                    [types.none()],
                    deployer.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'start-round',
                    [],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(1000000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(2000000)],
                    wallet_2.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(3000000)],
                    wallet_3.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(4000000)],
                    wallet_4.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(5000000)],
                    wallet_5.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(6000000)],
                    wallet_6.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(7000000)],
                    wallet_7.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(8000000)],
                    wallet_8.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(9000000)],
                    wallet_9.address
                ),
            ])

            // skip 150 blocks
            for (let i = 0; i < 150; i++) {
                chain.mineBlock([])
            }

            block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'mine',
                    [types.uint(1)],
                    wallet_9.address
                ),
            ])

            // skip 100 blocks
            for (let i = 0; i < 100; i++) {
                chain.mineBlock([])
            }

            // try claim next 150 blocks
            for (let i = 0; i < 150; i++) {
                chain.mineBlock([
                    Tx.contractCall(
                        'miamipool',
                        'claim-mining-reward',
                        [types.uint(1)],
                        wallet_9.address
                    ),
                ])
            }

            block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'claim-mining-reward',
                    [types.uint(1)],
                    wallet_9.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round',
                    [types.uint(1)],
                    wallet_9.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round-status',
                    [types.uint(1)],
                    wallet_9.address
                ),
            ])
            block.receipts[0].result.expectErr().expectUint(207)
            assertEquals(
                block.receipts[1].result,
                '(ok {blockHeight: u1, blocksWon: [u152, u153, u154, u155, u156, u157, u158, u159, u160, u161, u162, u163, u164, u165, u166, u167, u168, u169, u170, u171, u172, u173, u174, u175, u176, u177, u178, u179, u180, u181, u182, u183, u184, u185, u186, u187, u188, u189, u190, u191, u192, u193, u194, u195, u196, u197, u198, u199, u200, u201, u202, u203, u204, u205, u206, u207, u208, u209, u210, u211, u212, u213, u214, u215, u216, u217, u218, u219, u220, u221, u222, u223, u224, u225, u226, u227, u228, u229, u230, u231, u232, u233, u234, u235, u236, u237, u238, u239, u240, u241, u242, u243, u244, u245, u246, u247, u248, u249, u250, u251, u252, u253, u254, u255, u256, u257, u258, u259, u260, u261, u262, u263, u264, u265, u266, u267, u268, u269, u270, u271, u272, u273, u274, u275, u276, u277, u278, u279, u280, u281, u282, u283, u284, u285, u286, u287, u288, u289, u290, u291, u292, u293, u294, u295, u296, u297, u298, u299, u300, u301], participantIds: [u1, u2, u3, u4, u5, u6, u7, u8, u9], totalMiaWon: u37500000, totalStx: u45000000})'
            )
            assertEquals(
                block.receipts[2].result,
                '(ok {hasMined: true, lastBlockToCheck: u301, nextBlockToCheck: u302, requiredPayouts: u0, sendManyIds: []})'
            )
        },
    })
}
