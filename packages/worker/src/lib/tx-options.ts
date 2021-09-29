import { AnchorMode, PostConditionMode } from 'micro-stacks/transactions'
import { MIAMIPOOL_ADDY, MIAMIPOOL_NAME, NETWORK } from '.'

export function getAccounts() {
  // @ts-ignore
  if (ACCOUNTS != undefined) {
    // @ts-ignore
    return JSON.parse(ACCOUNTS)
  } else {
    return JSON.parse(
      '[{"stxPrivateKey":"8f7c13f6d2b34a653e7296a693de520aa351519450971f531277ea6a12b6857d01","dataPrivateKey":"8a5d607022feb134d9d801ef2dda06052a9b63fa91ecd5ce2284e3fca65aeb8d","appsKey":"xprvA2Aj6HKMYTBvnmyY2skvsPFAh7mbPpQTV8emwD3a1to18tuFtnJw8u4WJs3qL4bpaojc6rNQNW5uUHotHGTZDHoXhQZjfqDeu6xgWQEX6zp","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":0},{"stxPrivateKey":"11e3ab506284a71bf6e7dd79793054d56a276544bcabe999b211c3422be26ea301","dataPrivateKey":"42a2c8c3bd638ac8528aa20fb06e19c7d990c9c80d2fcdd261b8aafa2d381d82","appsKey":"xprvA1Fom3MqTuTjDa1NAMTQj2X3v3BACLRfnRsVGHPy8hiDAokboGJzUxCcsBmoCPchuFo9yiqccr5jX4hqcQ1MSuoTRbLHDdc1SSUwEji6hCc","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":1},{"stxPrivateKey":"35d9157a60c724d0b743d2e4701724177b9dfa7a3e75216930ef3aaa97ca693201","dataPrivateKey":"0c0561fbbdf6ff631ae55deff1d11a260d2bc70b4cbaa076642b62ee04f9d20a","appsKey":"xprv9zYfNQsGNQ8iTkHnMSahaNRnBx3CTUvCNJ2JiNTdFmqrQXe7CPttgYQnmGJsymXPxVJxoXffNi26gTE96VqcHATU9afscDUJKqBp8cKYH6q","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":2},{"stxPrivateKey":"013febff1abdc44a90e3dae73d1a153715f1e9d812ee5e66a5a3db48e84311ca01","dataPrivateKey":"332b1e3005d855026bb39079bef686c02c5df3f729426ed5039db7dc3456ff47","appsKey":"xprvA1Q2EGnvY61kA6rR7EEoEX5jj9QWTxjgXmiBshe3dXFz6NKc9q9rhdXUsowyTFoULTCDfqv7ocMhtSLie36koyTAhQRwgaJH9KZiLoorv2X","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":3},{"stxPrivateKey":"f2abc1d9d22ff25c7c944a2d19c82eeec1a2713ee13de014dcbce33d1275768b01","dataPrivateKey":"0d2bfff21d0b4a1ba84dbdb39d59efa4f84bc3fa1f97c301388895497a5a968c","appsKey":"xprv9zdvBeddEL5xh3iczuSaCH7jamHB5AkLznBpTYgjMRK1VX6RF7USU6cWm6f3nn9FeTTZ81ey7tsFgj6D5uq2gKZSUTK2m9dSvcyF23mPNXj","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":4},{"stxPrivateKey":"8759e115355eb8b2b9dbd628632f42069eda1323aba40410517cda7fe6fba44901","dataPrivateKey":"6944ccb67b537a4e5a5f8325bf2bc374c6cd505503162fe72c1d27dc265e6c48","appsKey":"xprvA2F46jHFHt739XhQjuk5TqdQt4ExtStmpfKTqurCM1j4YGxcFR1W5NqR7Pvmk9h8hDnTuexEBCQQ9g5izDVuVQW12FXPu3cdCjHMo9oS3E5","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":5},{"stxPrivateKey":"7de6c7841e61d6e3ff08690bbb3e56f304f1624a7cddbcd68d67ad90fe185fcd01","dataPrivateKey":"4ab9b917cc76a12fb59a138f75bb6bae2cd9d04bfcefa825017026112ba70d01","appsKey":"xprvA1C1c2eLm6Rqo2AEWSZk3jFYSKhJ6JGb4Y8dtuwxxtnmzyySFBqTX83mctYytV1a76fZ3AztH33T1Fct8iCfCu8F9SDZzhtvkPgypU5UgEv","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":6},{"stxPrivateKey":"f79eb479dfa5d5a56812e4bf9f6a94c92d3e1615824e9f33b8f0821a3475546c01","dataPrivateKey":"d5f0b65430d468fc7e736ddab313aba7479dd79e9cfe090455e894ce204de151","appsKey":"xprvA1cAAvzTLNvqEqVFWwAgTj9HnKvRmsHmo15c9idF4tE4bZqQXEV6T71d9TPWCMhwdYR5zhzMtP8mVoRTuxNJw8BjeB89FVWooJeYjH36ASE","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":7},{"stxPrivateKey":"8fde777a97b94f307c894e425937d77550c0e00be08b3039862d165e6a57b62501","dataPrivateKey":"e6039fa8ab0bb52ff9a4aaac71ae7c5689f85c5f9fd339943b991b241300ace5","appsKey":"xprvA1nLywX4tDXmMBx8bAjYzV6B5TCWUKJZThpUEAU5xjRTC44mxH4DUgQTn76Co35Q96CmZkeH4vz5iKsbxJwfP6h8TNYzDybsVEtVkMTcmuP","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":8},{"stxPrivateKey":"0e1e00c10b13179aa639db45823c7e159f83415531b84a9c5fc8c84093622ae301","dataPrivateKey":"081c9de54701cd703421ae0cf14353eeeee6ee4b1a62597951ee28fcd5d6ce93","appsKey":"xprvA1oJPWCSn5yCoC6pw2GgUJZUPRV7F5KVVVMk8pxszAVyn1crNhXjg1iiP2YCRsNv4dsEV5K1uSQj1hxHrRiEZ9G9yT74soEkBHkrRaTXHm6","salt":"c0a052befe931a78f447a8ae1c47cfe64ad66c01ed43fb471d4a6e87c280a55e","index":9}]'
    )
  }
}

export async function getDefaultTxOptions(args: any, functionName: string) {
  let nonce = await KV.get('nonce')

  if (nonce == null) {
    await KV.put('nonce', '0')
    nonce = 0
  } else {
    await KV.put('nonce', (parseInt(nonce) + 1).toString())
  }

  console.log('NONCE IN TX: ' + nonce)

  return {
    contractAddress: MIAMIPOOL_ADDY,
    contractName: MIAMIPOOL_NAME,
    functionName: functionName,
    functionArgs: args,
    senderKey:
      // @ts-ignore - PRIVATE_KEY is set as a encrypted secret
      '453fe49069fae3f3f6a37f4e29f33d2ff8cee98a4ea736951f7ea4b9bd65788001',
    validateWithAbi: true,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 50000n,
    nonce: nonce,
  }
}

export function getReadonlyTxOptions(args: any, functionName: string) {
  return {
    contractAddress: MIAMIPOOL_ADDY,
    contractName: MIAMIPOOL_NAME,
    functionName: functionName,
    functionArgs: args,
    network: NETWORK,
    senderAddress: MIAMIPOOL_ADDY,
  }
}
