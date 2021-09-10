import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts'
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts'

export async function payoutBeforeMiningStarts() {
  Clarinet.test({
    name: 'If payout-mia is called before mining has started, it fails.',
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

      block = chain.mineBlock([
        Tx.contractCall(
          'miamipool',
          'payout-mia',
          [types.uint(1)],
          wallet_1.address
        ),
      ])

      block.receipts[0].result.expectErr().expectUint(210)
    },
  })
}

export async function payoutAfterAllRedeemed() {
  Clarinet.test({
    name: "If payout-mia is called after all blocks are redeemed, it's successful",
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
        Tx.contractCall('miamipool', 'mine', [types.uint(1)], wallet_9.address),
      ])

      // skip 100 blocks
      for (let i = 0; i < 100; i++) {
        chain.mineBlock([])
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
          'payout-mia',
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
        Tx.contractCall('miamipool', 'get-mia-balance', [], wallet_9.address),
      ])

      block.receipts[0].result.expectOk().expectBool(true)
      block.receipts[1].result.expectOk().expectBool(true)

      assertEquals(
        block.receipts[2].result,
        '(ok {blockHeight: u1, blocksWon: [u152], participantIds: [u1, u2, u3, u4, u5, u6, u7, u8, u9], totalMiaWon: u250000, totalStx: u45000000})'
      )
      assertEquals(
        block.receipts[3].result,
        '(ok {hasMined: true, lastBlockToCheck: u301, nextBlockToCheck: u153, requiredPayouts: u1, sendManyIds: [u1, u2, u3, u4, u5, u6, u7, u8, u9]})'
      )

      block.receipts[4].result.expectOk().expectUint(4)
    },
  })
}

export async function payoutAfterAllPaidOut() {
  Clarinet.test({
    name: 'If payout-mia is called when participants have already been paid, it fails.',
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
        Tx.contractCall('miamipool', 'mine', [types.uint(1)], wallet_9.address),
      ])

      // skip 100 blocks
      for (let i = 0; i < 100; i++) {
        chain.mineBlock([])
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
          'payout-mia',
          [types.uint(1)],
          wallet_9.address
        ),
        Tx.contractCall(
          'miamipool',
          'payout-mia',
          [types.uint(1)],
          wallet_9.address
        ),
      ])
      block.receipts[2].result.expectErr().expectUint(209)
    },
  })
}
