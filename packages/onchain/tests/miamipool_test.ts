import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.14.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

// //=======================================================
// //             ACTIVATE CITYCOIN-CORE CONTRACT
// //=======================================================

// Clarinet.test({
//   name: "Activate citycoin-core contract",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectOk();
//   },
// });

// //=======================================================
// //                      START ROUND
// //=======================================================

// Clarinet.test({
//   name: "If start-round is first called, it initalises the first round",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectOk().expectTuple();
//     assertEquals(
//       block.receipts[1].result,
//       "(ok {blockHeight: u1, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
//     );
//   },
// });

// Clarinet.test({
//   name: "If start-round is called it initialises the round to the correct default values",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     chain.mineBlock([]);
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);

//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectOk().expectTuple();
//     assertEquals(
//       block.receipts[1].result,
//       "(ok {blockHeight: u2, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
//     );
//   },
// });

// Clarinet.test({
//   name: "If start-round is called before previous round has started mining, it fails",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//     ]);

//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectErr().expectUint(210);
//   },
// });

// Clarinet.test({
//   name: "If start-round is called before after previous round has started mining, it succeeds",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//     ]);

//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(2)],
//         wallet_1.address
//       ),
//     ]);

//     block.receipts[1].result.expectOk();
//     block.receipts[2].result.expectOk();
//     block.receipts[3].result.expectOk().expectTuple();

//     assertEquals(
//       block.receipts[3].result,
//       "(ok {blockHeight: u152, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
//     );
//   },
// });

// //=======================================================
// //                      ADD FUNDS
// //=======================================================

// Clarinet.test({
//   name: "If add-funds is called, it converts their principal to an id and stores it in current round",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let wallet_2 = accounts.get("wallet_2")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2000000)],
//         wallet_2.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "id-to-principal",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "principal-to-id",
//         [types.principal(wallet_2.address)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectOk();
//     block.receipts[2].result.expectOk();
//     block.receipts[3].result.expectOk().expectTuple();
//     assertEquals(
//       block.receipts[3].result,
//       "(ok {blockHeight: u1, blocksWon: [], participantIds: [u1, u2], totalMiaWon: u0, totalStx: u3000000})"
//     );
//     block.receipts[4].result.expectOk();
//     assertEquals(block.receipts[4].result, "(ok " + wallet_1.address + ")");
//     block.receipts[5].result.expectOk();
//     assertEquals(block.receipts[5].result, "(ok u2)");
//   },
// });

// Clarinet.test({
//   name: "If add-funds is called, it adds or increases their contributed STX",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-contribution",
//         [types.uint(1), types.uint(1)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-contribution",
//         [types.uint(1), types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectOk();
//     block.receipts[2].result.expectOk().expectUint(1000000);
//     block.receipts[3].result.expectOk();
//     block.receipts[4].result.expectOk().expectUint(3000000);
//   },
// });

// Clarinet.test({
//   name: "If add-funds is called, it adds or increases the current round's total STX",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let wallet_2 = accounts.get("wallet_2")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(5000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(3000000)],
//         wallet_2.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectOk();
//     block.receipts[2].result.expectOk();
//     block.receipts[3].result.expectOk().expectTuple();
//     assertEquals(
//       block.receipts[3].result,
//       "(ok {blockHeight: u1, blocksWon: [], participantIds: [u1, u2], totalMiaWon: u0, totalStx: u8000000})"
//     );
//   },
// });

// Clarinet.test({
//   name: "If add-funds is called, it appends contributing round to their round history",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//     ]);

//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-participant-round-history",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[5].result.expectOk().expectTuple();
//     assertEquals(
//       block.receipts[5].result,
//       "(ok {roundsParticipated: [u1, u2]})"
//     );
//   },
// });

// Clarinet.test({
//   name: "If add-funds is called, it fails if the contributed amount is too low",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(900000)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectErr().expectUint(200);
//   },
// });

// Clarinet.test({
//   name: "If add-funds is called, it fails if the round they're contributing to has already expired",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//     ]);
//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//     ]);

//     block.receipts[0].result.expectErr().expectUint(203);
//   },
// });

// //=======================================================
// //                      WITHDRAW FUNDS
// //=======================================================

// Clarinet.test({
//   name: "If withdraw-funds is called, it removes all or decreases their contributed STX",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2500000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-contribution",
//         [types.uint(1), types.uint(1)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(1500000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-contribution",
//         [types.uint(1), types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectOk();
//     block.receipts[2].result.expectOk();
//     block.receipts[3].result.expectOk().expectUint(1500000);
//     block.receipts[4].result.expectOk();
//     block.receipts[5].result.expectOk().expectUint(0);
//   },
// });

// Clarinet.test({
//   name: "If withdraw-funds is called, it decreases the round's total STX",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let wallet_2 = accounts.get("wallet_2")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2500000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1500000)],
//         wallet_2.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(500000)],
//         wallet_2.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[5].result.expectOk();
//     assertEquals(
//       block.receipts[5].result,
//       "(ok {blockHeight: u1, blocksWon: [], participantIds: [u1, u2], totalMiaWon: u0, totalStx: u2500000})"
//     );
//   },
// });

// Clarinet.test({
//   name: "If withdraw-funds is called, it fails if they try to withdraw more than their contribution",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2500000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(10000000)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[2].result.expectErr().expectUint(103);
//   },
// });

// Clarinet.test({
//   name: "If withdraw-funds is called, it fails if their id doesn't exist in the round",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[1].result.expectErr().expectUint(101);
//   },
// });

// Clarinet.test({
//   name: "If withdraw-funds is called, if all of their funds are withdrawn then the round is removed from their history",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(500000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-participant-round-history",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(500000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-participant-round-history",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[3].result.expectOk().expectTuple();
//     block.receipts[5].result.expectOk().expectTuple();
//     assertEquals(block.receipts[3].result, "(ok {roundsParticipated: [u1]})");
//     assertEquals(block.receipts[5].result, "(ok {roundsParticipated: []})");
//   },
// });

// Clarinet.test({
//   name: "If withdraw-funds is called, if all of their funds are withdrawn then their id is removed from the round",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(500000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(500000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[3].result.expectOk().expectTuple();
//     block.receipts[5].result.expectOk().expectTuple();
//     assertEquals(
//       block.receipts[3].result,
//       "(ok {blockHeight: u1, blocksWon: [], participantIds: [u1], totalMiaWon: u0, totalStx: u500000})"
//     );
//     assertEquals(
//       block.receipts[5].result,
//       "(ok {blockHeight: u1, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
//     );
//   },
// });

// Clarinet.test({
//   name: "If withdraw-funds is called, it fails if the round they're withdrawing from has already expired",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;
//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(500000)],
//         wallet_1.address
//       ),
//     ]);
//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall(
//         "miamipool",
//         "withdraw-funds",
//         [types.uint(500000)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[0].result.expectErr().expectUint(203);
//   },
// });

// //=======================================================
// //                      MINE
// //=======================================================

// Clarinet.test({
//   name: "If mine is called after raising period is over and the round hasn't mined yet, it succeeds.",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;
//     let wallet_2 = accounts.get("wallet_2")!;
//     let wallet_3 = accounts.get("wallet_3")!;
//     let wallet_4 = accounts.get("wallet_4")!;
//     let wallet_5 = accounts.get("wallet_5")!;
//     let wallet_6 = accounts.get("wallet_6")!;
//     let wallet_7 = accounts.get("wallet_7")!;
//     let wallet_8 = accounts.get("wallet_8")!;
//     let wallet_9 = accounts.get("wallet_9")!;

//     let block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2000000)],
//         wallet_2.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(3000000)],
//         wallet_3.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(4000000)],
//         wallet_4.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(5000000)],
//         wallet_5.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(6000000)],
//         wallet_6.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(7000000)],
//         wallet_7.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(8000000)],
//         wallet_8.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(9000000)],
//         wallet_9.address
//       ),
//     ]);

//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_9.address),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(2)],
//         wallet_9.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round-status",
//         [types.uint(1)],
//         wallet_9.address
//       ),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectOk().expectTuple();
//     block.receipts[2].result.expectOk().expectTuple();

//     assertEquals(
//       block.receipts[1].result,
//       "(ok {blockHeight: u152, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
//     );
//     assertEquals(
//       block.receipts[2].result,
//       "(ok {hasMined: true, lastBlockToCheck: u301, nextBlockToCheck: u152, requiredPayouts: u0, sendManyIds: []})"
//     );
//   },
// });

// Clarinet.test({
//   name: "If mine is called after conditions are met but total STX < 1.5 STX, start next round without mining.",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1499999)],
//         wallet_1.address
//       ),
//     ]);

//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(2)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round-status",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectOk().expectTuple();
//     block.receipts[2].result.expectOk().expectTuple();

//     assertEquals(
//       block.receipts[1].result,
//       "(ok {blockHeight: u152, blocksWon: [], participantIds: [], totalMiaWon: u0, totalStx: u0})"
//     );
//     assertEquals(
//       block.receipts[2].result,
//       "(ok {hasMined: true, lastBlockToCheck: u0, nextBlockToCheck: u1, requiredPayouts: u0, sendManyIds: []})"
//     );
//   },
// });

// Clarinet.test({
//   name: "If mine is called when the round has already mined, it fails.",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//     ]);

//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
//     ]);
//     block.receipts[0].result.expectOk();
//     block.receipts[1].result.expectErr().expectUint(211);
//   },
// });

// Clarinet.test({
//   name: "If mine is called when the round is currently active, it fails.",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//     ]);

//     block = chain.mineBlock([
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
//     ]);
//     block.receipts[0].result.expectErr().expectUint(202);
//   },
// });

// //=======================================================
// //              CAN CLAIM MINING REWARD
// //=======================================================

// Clarinet.test({
//   name: "If claim-mining-reward is called before mining has started, it fails.",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let wallet_1 = accounts.get("wallet_1")!;

//     let block = chain.mineBlock([
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "claim-mining-reward",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[1].result.expectErr().expectUint(210);
//   },
// });

// Clarinet.test({
//   name: "If claim-mining-reward is called before waiting 100 blocks after mine was called, it fails.",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2000000)],
//         wallet_1.address
//       ),
//     ]);

//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "get-round-status",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     for (let i = 0; i < 98; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall(
//         "miamipool",
//         "claim-mining-reward",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);

//     block.receipts[0].result.expectErr().expectUint(206);
//   },
// });

// Clarinet.test({
//   name: "If claim-mining-reward is called for a round that didn't mine due to not enough STX raised, it fails.",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1499999)],
//         wallet_1.address
//       ),
//     ]);

//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_1.address),
//     ]);

//     // skip 100 blocks
//     for (let i = 0; i < 100; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall(
//         "miamipool",
//         "get-round-status",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "claim-mining-reward",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round-status",
//         [types.uint(1)],
//         wallet_1.address
//       ),
//     ]);
//     block.receipts[1].result.expectErr().expectUint(207);
//   },
// });

// Clarinet.test({
//   name: "If claim-mining-reward is called and can-claim returns true, we store the block won, redeem it and increase totalMiaWon.",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;
//     let wallet_2 = accounts.get("wallet_2")!;
//     let wallet_3 = accounts.get("wallet_3")!;
//     let wallet_4 = accounts.get("wallet_4")!;
//     let wallet_5 = accounts.get("wallet_5")!;
//     let wallet_6 = accounts.get("wallet_6")!;
//     let wallet_7 = accounts.get("wallet_7")!;
//     let wallet_8 = accounts.get("wallet_8")!;
//     let wallet_9 = accounts.get("wallet_9")!;

//     let block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2000000)],
//         wallet_2.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(3000000)],
//         wallet_3.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(4000000)],
//         wallet_4.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(5000000)],
//         wallet_5.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(6000000)],
//         wallet_6.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(7000000)],
//         wallet_7.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(8000000)],
//         wallet_8.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(9000000)],
//         wallet_9.address
//       ),
//     ]);

//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_9.address),
//     ]);

//     // skip 100 blocks
//     for (let i = 0; i < 100; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall(
//         "miamipool",
//         "get-round-status",
//         [types.uint(1)],
//         wallet_9.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "claim-mining-reward",
//         [types.uint(1)],
//         wallet_9.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_9.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round-status",
//         [types.uint(1)],
//         wallet_9.address
//       ),
//     ]);

//     assertEquals(
//       block.receipts[2].result,
//       "(ok {blockHeight: u1, blocksWon: [u152], participantIds: [u1, u2, u3, u4, u5, u6, u7, u8, u9], totalMiaWon: u250000, totalStx: u45000000})"
//     );
//     assertEquals(
//       block.receipts[3].result,
//       "(ok {hasMined: true, lastBlockToCheck: u301, nextBlockToCheck: u153, requiredPayouts: u0, sendManyIds: []})"
//     );
//   },
// });

// Clarinet.test({
//   name: "If claim-mining-reward is called after all blocks have already been checked, it fails",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;
//     let wallet_2 = accounts.get("wallet_2")!;
//     let wallet_3 = accounts.get("wallet_3")!;
//     let wallet_4 = accounts.get("wallet_4")!;
//     let wallet_5 = accounts.get("wallet_5")!;
//     let wallet_6 = accounts.get("wallet_6")!;
//     let wallet_7 = accounts.get("wallet_7")!;
//     let wallet_8 = accounts.get("wallet_8")!;
//     let wallet_9 = accounts.get("wallet_9")!;

//     let block = chain.mineBlock([
//       Tx.contractCall(
//         "citycoin-auth",
//         "initialize-contracts",
//         [
//           types.principal(
//             "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.citycoin-core-v1"
//           ),
//         ],
//         deployer.address
//       ),
//       Tx.contractCall(
//         "citycoin-core-v1",
//         "register-user",
//         [types.none()],
//         deployer.address
//       ),
//       Tx.contractCall("miamipool", "start-round", [], wallet_1.address),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(1000000)],
//         wallet_1.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(2000000)],
//         wallet_2.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(3000000)],
//         wallet_3.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(4000000)],
//         wallet_4.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(5000000)],
//         wallet_5.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(6000000)],
//         wallet_6.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(7000000)],
//         wallet_7.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(8000000)],
//         wallet_8.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "add-funds",
//         [types.uint(9000000)],
//         wallet_9.address
//       ),
//     ]);

//     // skip 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall("miamipool", "mine", [types.uint(1)], wallet_9.address),
//     ]);

//     // skip 100 blocks
//     for (let i = 0; i < 100; i++) {
//       chain.mineBlock([]);
//     }

//     // try claim next 150 blocks
//     for (let i = 0; i < 150; i++) {
//       chain.mineBlock([
//         Tx.contractCall(
//           "miamipool",
//           "claim-mining-reward",
//           [types.uint(1)],
//           wallet_9.address
//         ),
//       ]);
//     }

//     block = chain.mineBlock([
//       Tx.contractCall(
//         "miamipool",
//         "claim-mining-reward",
//         [types.uint(1)],
//         wallet_9.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round",
//         [types.uint(1)],
//         wallet_9.address
//       ),
//       Tx.contractCall(
//         "miamipool",
//         "get-round-status",
//         [types.uint(1)],
//         wallet_9.address
//       ),
//     ]);
//     block.receipts[0].result.expectErr().expectUint(207);
//     assertEquals(
//       block.receipts[1].result,
//       "(ok {blockHeight: u1, blocksWon: [u152, u153, u154, u155, u156, u157, u158, u159, u160, u161, u162, u163, u164, u165, u166, u167, u168, u169, u170, u171, u172, u173, u174, u175, u176, u177, u178, u179, u180, u181, u182, u183, u184, u185, u186, u187, u188, u189, u190, u191, u192, u193, u194, u195, u196, u197, u198, u199, u200, u201, u202, u203, u204, u205, u206, u207, u208, u209, u210, u211, u212, u213, u214, u215, u216, u217, u218, u219, u220, u221, u222, u223, u224, u225, u226, u227, u228, u229, u230, u231, u232, u233, u234, u235, u236, u237, u238, u239, u240, u241, u242, u243, u244, u245, u246, u247, u248, u249, u250, u251, u252, u253, u254, u255, u256, u257, u258, u259, u260, u261, u262, u263, u264, u265, u266, u267, u268, u269, u270, u271, u272, u273, u274, u275, u276, u277, u278, u279, u280, u281, u282, u283, u284, u285, u286, u287, u288, u289, u290, u291, u292, u293, u294, u295, u296, u297, u298, u299, u300, u301], participantIds: [u1, u2, u3, u4, u5, u6, u7, u8, u9], totalMiaWon: u37500000, totalStx: u45000000})"
//     );
//     assertEquals(
//       block.receipts[2].result,
//       "(ok {hasMined: true, lastBlockToCheck: u301, nextBlockToCheck: u302, requiredPayouts: u0, sendManyIds: []})"
//     );
//   },
// });

//=======================================================
//                    PAYOUT MIA
//=======================================================

Clarinet.test({
  name: "If payout-mia is called after all blocks are redeemed, it succeeds",
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
    ]);

    // skip 100 blocks
    for (let i = 0; i < 100; i++) {
      chain.mineBlock([]);
    }

    block = chain.mineBlock([
      Tx.contractCall(
        "miamipool",
        "claim-mining-reward",
        [types.uint(1)],
        wallet_9.address
      ),
      Tx.contractCall(
        "miamipool",
        "payout-mia",
        [types.uint(1)],
        wallet_9.address
      ),
      Tx.contractCall(
        "miamipool",
        "get-round",
        [types.uint(1)],
        wallet_9.address
      ),
      Tx.contractCall(
        "miamipool",
        "get-round-status",
        [types.uint(1)],
        wallet_9.address
      ),
      Tx.contractCall("miamipool", "get-mia-balance", [], wallet_9.address),
    ]);

    console.log(block.receipts[0].result);
    console.log(block.receipts[1].result);
    console.log(block.receipts[2].result);
    console.log(block.receipts[3].result);
    console.log(block.receipts[4].result);
  },
});
