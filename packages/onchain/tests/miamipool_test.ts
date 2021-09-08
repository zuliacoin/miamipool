import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.14.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

//=======================================================
//             ACTIVATE CITY-CORE CONTRACT
//=======================================================

Clarinet.test({
  name: "Activate citycoin-core contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([
      Tx.contractCall(
        "citycoin-auth",
        "initialize-contracts",
        [
          types.principal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "citycoin-core-v1",
        "register-user",
        [types.none()],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();
  },
});

//=======================================================
//                      START ROUND
//=======================================================

Clarinet.test({
  name: "If start-round is first called, it initalises the first round",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "get-round",
        [types.uint(1)],
        wallet_1.address
      ),
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk().expectTuple();
    assertEquals(
      block.receipts[1].result,
      "(ok {blockHeight: u1, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
    );
  },
});

Clarinet.test({
  name: "If start-round is called it initialises the round to the correct default values",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    chain.mineBlock([]);
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "get-round",
        [types.uint(1)],
        wallet_1.address
      ),
    ]);

    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk().expectTuple();
    assertEquals(
      block.receipts[1].result,
      "(ok {blockHeight: u2, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
    );
  },
});

Clarinet.test({
  name: "If start-round is called before previous round has started mining, it fails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
    ]);

    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectErr().expectUint(210);
  },
});

Clarinet.test({
  name: "If start-round is called before after previous round has started mining, it succeeds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(1000000)],
        wallet_1.address
      ),
    ]);

    // skip 150 blocks
    for (let i = 0; i < 150; i++) {
      chain.mineBlock([]);
    }

    block = chain.mineBlock([
      Tx.contractCall(
        "citycoin-auth",
        "initialize-contracts",
        [
          types.principal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "citycoin-core-v1",
        "register-user",
        [types.none()],
        deployer.address
      ),
      Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "get-round",
        [types.uint(2)],
        wallet_1.address
      ),
    ]);

    block.receipts[1].result.expectOk();
    block.receipts[2].result.expectOk();
    block.receipts[3].result.expectOk().expectTuple();

    assertEquals(
      block.receipts[3].result,
      "(ok {blockHeight: u152, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
    );
  },
});

//=======================================================
//                      ADD FUNDS
//=======================================================

Clarinet.test({
  name: "If add-funds is called, it converts their principal to an id and stores it in current round",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(1000000)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(2000000)],
        wallet_2.address
      ),
      Tx.contractCall(
        "miamipool",
        "get-round",
        [types.uint(1)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "id-to-principal",
        [types.uint(1)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "principal-to-id",
        [types.principal(wallet_2.address)],
        wallet_1.address
      ),
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();
    block.receipts[2].result.expectOk();
    block.receipts[3].result.expectOk().expectTuple();
    assertEquals(
      block.receipts[3].result,
      "(ok {blockHeight: u1, blocksWon: [], participantIds: [u1, u2], totalMiaWon: u0, totalStx: u3000000})"
    );
    block.receipts[4].result.expectOk();
    assertEquals(block.receipts[4].result, "(ok " + wallet_1.address + ")");
    block.receipts[5].result.expectOk();
    assertEquals(block.receipts[5].result, "(ok u2)");
  },
});

Clarinet.test({
  name: "If add-funds is called, it adds or increases their contributed STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(1000000)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "get-contribution",
        [types.uint(1), types.uint(1)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(2000000)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "get-contribution",
        [types.uint(1), types.uint(1)],
        wallet_1.address
      ),
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();
    block.receipts[2].result.expectOk().expectUint(1000000);
    block.receipts[3].result.expectOk();
    block.receipts[4].result.expectOk().expectUint(3000000);
  },
});

Clarinet.test({
  name: "If add-funds is called, it adds or increases the current round's total STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(5000000)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(3000000)],
        wallet_2.address
      ),
      Tx.contractCall(
        "miamipool",
        "get-round",
        [types.uint(1)],
        wallet_1.address
      ),
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();
    block.receipts[2].result.expectOk();
    block.receipts[3].result.expectOk().expectTuple();
    assertEquals(
      block.receipts[3].result,
      "(ok {blockHeight: u1, blocksWon: [], participantIds: [u1, u2], totalMiaWon: u0, totalStx: u8000000})"
    );
  },
});

Clarinet.test({
  name: "If add-funds is called, it appends contributing round to their round history",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(1000000)],
        wallet_1.address
      ),
    ]);

    // skip 150 blocks
    for (let i = 0; i < 150; i++) {
      chain.mineBlock([]);
    }

    block = chain.mineBlock([
      Tx.contractCall(
        "citycoin-auth",
        "initialize-contracts",
        [
          types.principal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "citycoin-core-v1",
        "register-user",
        [types.none()],
        deployer.address
      ),
      Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(2000000)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "get-participant-round-history",
        [types.uint(1)],
        wallet_1.address
      ),
    ]);
    block.receipts[5].result.expectOk().expectTuple();
    assertEquals(
      block.receipts[5].result,
      "(ok {roundsParticipated: [u1, u2]})"
    );
  },
});

Clarinet.test({
  name: "If add-funds is called, it fails if the contributed amount is too low",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(900000)],
        wallet_1.address
      ),
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectErr().expectUint(200);
  },
});

Clarinet.test({
  name: "If add-funds is called, it fails if the round they're contributing to has already expired",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
    ]);
    // skip 150 blocks
    for (let i = 0; i < 150; i++) {
      chain.mineBlock([]);
    }

    block = chain.mineBlock([
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(1000000)],
        wallet_1.address
      ),
    ]);

    block.receipts[0].result.expectErr().expectUint(203);
  },
});

//=======================================================
//                      MINE
//=======================================================

Clarinet.test({
  name: "If mine is called after raising period is over and the round hasn't mined yet, it succeeds.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    let wallet_4 = accounts.get("wallet_4")!;
    let wallet_5 = accounts.get("wallet_5")!;
    let wallet_6 = accounts.get("wallet_6")!;
    let wallet_7 = accounts.get("wallet_7")!;
    let wallet_8 = accounts.get("wallet_8")!;
    let wallet_9 = accounts.get("wallet_9")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "citycoin-auth",
        "initialize-contracts",
        [
          types.principal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "citycoin-core-v1",
        "register-user",
        [types.none()],
        deployer.address
      ),
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(1000000)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(2000000)],
        wallet_2.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(3000000)],
        wallet_3.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(4000000)],
        wallet_4.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(5000000)],
        wallet_5.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(6000000)],
        wallet_6.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(7000000)],
        wallet_7.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(8000000)],
        wallet_8.address
      ),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(9000000)],
        wallet_9.address
      ),
    ]);

    // skip 150 blocks
    for (let i = 0; i < 150; i++) {
      chain.mineBlock([]);
    }

    block = chain.mineBlock([
      Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_9.address),
      Tx.contractCall(
        "miamipool",
        "get-round",
        [types.uint(2)],
        wallet_9.address
      ),
      Tx.contractCall(
        "miamipool",
        "get-round-status",
        [types.uint(1)],
        wallet_9.address
      ),
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk().expectTuple();
    block.receipts[2].result.expectOk().expectTuple();

    assertEquals(
      block.receipts[1].result,
      "(ok {blockHeight: u152, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
    );
    assertEquals(
      block.receipts[2].result,
      "(ok {hasMined: true, indexOfBlockToClaim: u0, lastBlockChecked: u151, lastBlockToCheck: u302, requiredPayouts: u0, sendManyIds: []})"
    );
  },
});

Clarinet.test({
  name: "If mine is called after conditions are met but total STX < 1.5 STX, start next round without mining.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "citycoin-auth",
        "initialize-contracts",
        [
          types.principal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "citycoin-core-v1",
        "register-user",
        [types.none()],
        deployer.address
      ),
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(1499999)],
        wallet_1.address
      ),
    ]);

    // skip 150 blocks
    for (let i = 0; i < 150; i++) {
      chain.mineBlock([]);
    }

    block = chain.mineBlock([
      Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "get-round",
        [types.uint(2)],
        wallet_1.address
      ),
      Tx.contractCall(
        "miamipool",
        "get-round-status",
        [types.uint(1)],
        wallet_1.address
      ),
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk().expectTuple();
    block.receipts[2].result.expectOk().expectTuple();

    assertEquals(
      block.receipts[1].result,
      "(ok {blockHeight: u152, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
    );
    assertEquals(
      block.receipts[2].result,
      "(ok {hasMined: true, indexOfBlockToClaim: u0, lastBlockChecked: u0, lastBlockToCheck: u0, requiredPayouts: u0, sendManyIds: []})"
    );
  },
});

Clarinet.test({
  name: "If mine is called when the round has already mined, it fails.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "citycoin-auth",
        "initialize-contracts",
        [
          types.principal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "citycoin-core-v1",
        "register-user",
        [types.none()],
        deployer.address
      ),
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(1000000)],
        wallet_1.address
      ),
    ]);

    // skip 150 blocks
    for (let i = 0; i < 150; i++) {
      chain.mineBlock([]);
    }

    block = chain.mineBlock([
      Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
      Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectErr().expectUint(211);
  },
});

Clarinet.test({
  name: "If mine is called when the round is currently active, it fails.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "citycoin-auth",
        "initialize-contracts",
        [
          types.principal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "citycoin-core-v1",
        "register-user",
        [types.none()],
        deployer.address
      ),
      Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
      Tx.contractCall(
        "miamipool",
        "add-funds",
        [types.uint(1000000)],
        wallet_1.address
      ),
    ]);

    block = chain.mineBlock([
      Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(202);
  },
});

// withdraw-funds
// can-claim-mining-reward
// claim-mining-reward
// payout-mia
