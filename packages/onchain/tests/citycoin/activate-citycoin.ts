import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts'

export async function activateCitycoin() {
  Clarinet.test({
    name: 'Activate citycoin-core contract',
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get('deployer')!
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
      ])
      block.receipts[0].result.expectOk()
      block.receipts[1].result.expectOk()
    },
  })
}
