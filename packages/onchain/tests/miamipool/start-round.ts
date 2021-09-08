import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types,
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts'
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts'

export async function startRoundAndInit() {
    Clarinet.test({
        name: 'If start-round is first called, it initalises the first round',
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
                    'get-round',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])
            block.receipts[0].result.expectOk()
            block.receipts[1].result.expectOk().expectTuple()
            assertEquals(
                block.receipts[1].result,
                '(ok {blockHeight: u1, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})'
            )
        },
    })
}

export async function startRoundToCorrectValues() {
    Clarinet.test({
        name: 'If start-round is called it initialises the round to the correct default values',
        async fn(chain: Chain, accounts: Map<string, Account>) {
            let wallet_1 = accounts.get('wallet_1')!
            chain.mineBlock([])
            let block = chain.mineBlock([
                Tx.contractCall(
                    'miamipool',
                    'start-round',
                    [],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])

            block.receipts[0].result.expectOk()
            block.receipts[1].result.expectOk().expectTuple()
            assertEquals(
                block.receipts[1].result,
                '(ok {blockHeight: u2, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})'
            )
        },
    })
}

export async function startRoundWhenPrevRoundIsMining() {
    Clarinet.test({
        name: 'If start-round is called before previous round has started mining, it fails',
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
                    'start-round',
                    [],
                    wallet_1.address
                ),
            ])

            block.receipts[0].result.expectOk()
            block.receipts[1].result.expectErr().expectUint(210)
        },
    })
}

export async function startRoundAfterPrevRoundMined() {
    Clarinet.test({
        name: 'If start-round is called before after previous round has started mining, it succeeds',
        async fn(chain: Chain, accounts: Map<string, Account>) {
            let deployer = accounts.get('deployer')!
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
                    'add-funds',
                    [types.uint(1000000)],
                    wallet_1.address
                ),
            ])

            // skip 150 blocks
            for (let i = 0; i < 150; i++) {
                chain.mineBlock([])
            }

            block = chain.mineBlock([
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
                    'mine',
                    [types.uint(1)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round',
                    [types.uint(2)],
                    wallet_1.address
                ),
            ])

            block.receipts[1].result.expectOk()
            block.receipts[2].result.expectOk()
            block.receipts[3].result.expectOk().expectTuple()

            assertEquals(
                block.receipts[3].result,
                '(ok {blockHeight: u152, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})'
            )
        },
    })
}
