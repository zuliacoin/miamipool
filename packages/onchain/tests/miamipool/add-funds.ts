import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts'
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts'

export async function addFundsAddToRound() {
  Clarinet.test({
    name: 'If add-funds is called, it converts their principal to an id and stores it in current round',
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let wallet_1 = accounts.get('wallet_1')!
      let wallet_2 = accounts.get('wallet_2')!
      let block = chain.mineBlock([
        Tx.contractCall('miamipool', 'start-round', [], wallet_1.address),
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
          'get-round',
          [types.uint(1)],
          wallet_1.address
        ),
        Tx.contractCall(
          'miamipool',
          'id-to-principal',
          [types.uint(1)],
          wallet_1.address
        ),
        Tx.contractCall(
          'miamipool',
          'principal-to-id',
          [types.principal(wallet_2.address)],
          wallet_1.address
        ),
      ])
      block.receipts[0].result.expectOk()
      block.receipts[1].result.expectOk()
      block.receipts[2].result.expectOk()
      block.receipts[3].result.expectOk().expectTuple()
      assertEquals(
        block.receipts[3].result,
        '(ok {blockHeight: u1, blocksWon: [], participantIds: [u1, u2], totalMiaWon: u0, totalStx: u3000000})'
      )
      block.receipts[4].result.expectOk()
      assertEquals(block.receipts[4].result, '(ok ' + wallet_1.address + ')')
      block.receipts[5].result.expectOk()
      assertEquals(block.receipts[5].result, '(ok u2)')
    },
  })
}

export async function addFundsAndIncreaseContributedStx() {
  Clarinet.test({
    name: 'If add-funds is called, it adds or increases their contributed STX',
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let wallet_1 = accounts.get('wallet_1')!
      let block = chain.mineBlock([
        Tx.contractCall('miamipool', 'start-round', [], wallet_1.address),
        Tx.contractCall(
          'miamipool',
          'add-funds',
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
          'add-funds',
          [types.uint(2000000)],
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
      block.receipts[2].result.expectOk().expectUint(1000000)
      block.receipts[3].result.expectOk()
      block.receipts[4].result.expectOk().expectUint(3000000)
    },
  })
}

export async function addFundsAndIncreaseRoundStx() {
  Clarinet.test({
    name: "If add-funds is called, it adds or increases the current round's total STX",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let wallet_1 = accounts.get('wallet_1')!
      let wallet_2 = accounts.get('wallet_2')!
      let block = chain.mineBlock([
        Tx.contractCall('miamipool', 'start-round', [], wallet_1.address),
        Tx.contractCall(
          'miamipool',
          'add-funds',
          [types.uint(5000000)],
          wallet_1.address
        ),
        Tx.contractCall(
          'miamipool',
          'add-funds',
          [types.uint(3000000)],
          wallet_2.address
        ),
        Tx.contractCall(
          'miamipool',
          'get-round',
          [types.uint(1)],
          wallet_1.address
        ),
      ])
      block.receipts[0].result.expectOk()
      block.receipts[1].result.expectOk()
      block.receipts[2].result.expectOk()
      block.receipts[3].result.expectOk().expectTuple()
      assertEquals(
        block.receipts[3].result,
        '(ok {blockHeight: u1, blocksWon: [], participantIds: [u1, u2], totalMiaWon: u0, totalStx: u8000000})'
      )
    },
  })
}

export async function addFundsAndAddToHistory() {
  Clarinet.test({
    name: 'If add-funds is called, it appends contributing round to their round history',
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get('deployer')!
      let wallet_1 = accounts.get('wallet_1')!
      let block = chain.mineBlock([
        Tx.contractCall('miamipool', 'start-round', [], wallet_1.address),
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
        Tx.contractCall('miamipool', 'mine', [types.uint(1)], wallet_1.address),
        Tx.contractCall('miamipool', 'start-round', [], wallet_1.address),
        Tx.contractCall(
          'miamipool',
          'add-funds',
          [types.uint(2000000)],
          wallet_1.address
        ),
        Tx.contractCall(
          'miamipool',
          'get-participant-round-history',
          [types.uint(1)],
          wallet_1.address
        ),
      ])
      block.receipts[5].result.expectOk().expectTuple()
      assertEquals(
        block.receipts[5].result,
        '(ok {roundsParticipated: [u1, u2]})'
      )
    },
  })
}

export async function addFundsUnderMin() {
  Clarinet.test({
    name: 'If add-funds is called, it fails if the contributed amount is too low',
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let wallet_1 = accounts.get('wallet_1')!
      let block = chain.mineBlock([
        Tx.contractCall('miamipool', 'start-round', [], wallet_1.address),
        Tx.contractCall(
          'miamipool',
          'add-funds',
          [types.uint(900000)],
          wallet_1.address
        ),
      ])
      block.receipts[0].result.expectOk()
      block.receipts[1].result.expectErr().expectUint(200)
    },
  })
}

export async function addFundsToExpiredRound() {
  Clarinet.test({
    name: "If add-funds is called, it fails if the round they're contributing to has already expired",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let wallet_1 = accounts.get('wallet_1')!
      let block = chain.mineBlock([
        Tx.contractCall('miamipool', 'start-round', [], wallet_1.address),
      ])
      // skip 150 blocks
      for (let i = 0; i < 150; i++) {
        chain.mineBlock([])
      }

      block = chain.mineBlock([
        Tx.contractCall(
          'miamipool',
          'add-funds',
          [types.uint(1000000)],
          wallet_1.address
        ),
      ])

      block.receipts[0].result.expectErr().expectUint(203)
    },
  })
}
