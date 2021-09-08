import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types,
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts'
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts'

export async function withdrawAndDecreaseStx() {
    Clarinet.test({
        name: 'If withdraw-funds is called, it removes all or decreases their contributed STX',
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
                    'add-funds',
                    [types.uint(2500000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'withdraw-funds',
                    [types.uint(1000000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-contribution',
                    [types.uint(1), types.uint(1)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'withdraw-funds',
                    [types.uint(1500000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-contribution',
                    [types.uint(1), types.uint(1)],
                    wallet_1.address
                ),
            ])
            block.receipts[0].result.expectOk()
            block.receipts[1].result.expectOk()
            block.receipts[2].result.expectOk()
            block.receipts[3].result.expectOk().expectUint(1500000)
            block.receipts[4].result.expectOk()
            block.receipts[5].result.expectOk().expectUint(0)
        },
    })
}

export async function withdrawAndDecreaseRoundStx() {
    Clarinet.test({
        name: "If withdraw-funds is called, it decreases the round's total STX",
        async fn(chain: Chain, accounts: Map<string, Account>) {
            let wallet_1 = accounts.get('wallet_1')!
            let wallet_2 = accounts.get('wallet_2')!
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
                    [types.uint(2500000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'add-funds',
                    [types.uint(1500000)],
                    wallet_2.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'withdraw-funds',
                    [types.uint(1000000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'withdraw-funds',
                    [types.uint(500000)],
                    wallet_2.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])
            block.receipts[5].result.expectOk()
            assertEquals(
                block.receipts[5].result,
                '(ok {blockHeight: u1, blocksWon: [], participantIds: [u1, u2], totalMiaWon: u0, totalStx: u2500000})'
            )
        },
    })
}

export async function withdrawMoreThanBalance() {
    Clarinet.test({
        name: 'If withdraw-funds is called, it fails if they try to withdraw more than their contribution',
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
                    'add-funds',
                    [types.uint(2500000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'withdraw-funds',
                    [types.uint(10000000)],
                    wallet_1.address
                ),
            ])
            block.receipts[2].result.expectErr().expectUint(103)
        },
    })
}

export async function withdrawWithoutContributing() {
    Clarinet.test({
        name: "If withdraw-funds is called, it fails if their id doesn't exist in the round",
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
                    'withdraw-funds',
                    [types.uint(1000000)],
                    wallet_1.address
                ),
            ])
            block.receipts[1].result.expectErr().expectUint(101)
        },
    })
}

export async function withdrawAndRemoveHistory() {
    Clarinet.test({
        name: 'If withdraw-funds is called, if all of their funds are withdrawn then the round is removed from their history',
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
                    'add-funds',
                    [types.uint(1000000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'withdraw-funds',
                    [types.uint(500000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-participant-round-history',
                    [types.uint(1)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'withdraw-funds',
                    [types.uint(500000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-participant-round-history',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])
            block.receipts[3].result.expectOk().expectTuple()
            block.receipts[5].result.expectOk().expectTuple()
            assertEquals(
                block.receipts[3].result,
                '(ok {roundsParticipated: [u1]})'
            )
            assertEquals(
                block.receipts[5].result,
                '(ok {roundsParticipated: []})'
            )
        },
    })
}

export async function withdrawAndRemoveFromRound() {
    Clarinet.test({
        name: 'If withdraw-funds is called, if all of their funds are withdrawn then their id is removed from the round',
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
                    'add-funds',
                    [types.uint(1000000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'withdraw-funds',
                    [types.uint(500000)],
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
                    'withdraw-funds',
                    [types.uint(500000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'get-round',
                    [types.uint(1)],
                    wallet_1.address
                ),
            ])
            block.receipts[3].result.expectOk().expectTuple()
            block.receipts[5].result.expectOk().expectTuple()
            assertEquals(
                block.receipts[3].result,
                '(ok {blockHeight: u1, blocksWon: [], participantIds: [u1], totalMiaWon: u0, totalStx: u500000})'
            )
            assertEquals(
                block.receipts[5].result,
                '(ok {blockHeight: u1, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})'
            )
        },
    })
}

export async function withdrawAfterRoundExpired() {
    Clarinet.test({
        name: "If withdraw-funds is called, it fails if the round they're withdrawing from has already expired",
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
                    'add-funds',
                    [types.uint(1000000)],
                    wallet_1.address
                ),
                Tx.contractCall(
                    'miamipool',
                    'withdraw-funds',
                    [types.uint(500000)],
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
                    'withdraw-funds',
                    [types.uint(500000)],
                    wallet_1.address
                ),
            ])
            block.receipts[0].result.expectErr().expectUint(203)
        },
    })
}
