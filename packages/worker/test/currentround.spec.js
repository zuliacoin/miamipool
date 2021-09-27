import test from "ava"
import { Miniflare } from "miniflare"

test.beforeEach((t) => {
  const mf = new Miniflare({
    buildCommand: undefined,
  })
  t.context = { mf }
})

test("increments path count for new paths", async (t) => {
  // Get the Miniflare instance
  const { mf } = t.context
  // Dispatch a fetch event to our worker
  const res = await mf.dispatchFetch("http://localhost:8787/currentblock")

  const block = await (await fetch(`https://stacks-node-api.mainnet.stacks.co/extended/v1/block?limit=1`)).json().results[0].height

  const returnedBlock = await res.json()
  // Check the count is "1" as this is the first time we've been to this path
  t.is(returnedBlock.block, block)
});