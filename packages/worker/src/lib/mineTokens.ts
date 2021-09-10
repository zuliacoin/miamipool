import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
} from 'micro-stacks/transactions'
import { StacksTestnet, StacksMainnet } from 'micro-stacks/network'
import { noneCV, uintCV } from 'micro-stacks/clarity'

export async function mineTokens(): Promise<Response> {
  const network = new StacksTestnet()

  const txOptions = {
    contractAddress: 'ST3CK642B6119EVC6CT550PW5EZZ1AJW6608HK60A',
    contractName: 'citycoin-core-v4',
    functionName: 'mine-tokens',
    functionArgs: [uintCV(100000), noneCV()],
    // @ts-ignore
    senderKey: PRIVATE_KEY,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardSTXPostCondition(
        'ST2A1S52EP2J6GZ2DTBA8WKEDCY8V4PVB6JX5SHSD',
        FungibleConditionCode.Equal,
        uintCV(100000).value
      ),
    ],
  }

  const transaction = await makeContractCall(txOptions)

  const broadcastResponse = await broadcastTransaction(transaction, network)
  const result = broadcastResponse
  return new Response(JSON.stringify(result))
}
