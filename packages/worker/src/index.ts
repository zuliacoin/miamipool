import { handleCron } from './cron'
import { Router } from 'itty-router'

const router = Router()

router.get('/', () => {
  return new Response('eth small pp. bitcoin big pp. big, big pp')
})

router.get('/currentround', async () => {
  // @ts-ignore
  const currentRound = parseInt(await KV.get('currentRound'))

  return new Response(
    JSON.stringify({
      round: currentRound,
    })
  )
})

router.get('/currentblock', async () => {
  // @ts-ignore
  const currentBlock = parseInt(await KV.get('currentBlock'))

  return new Response(
    JSON.stringify({
      block: currentBlock,
    })
  )
})

router.get('/round/:id', async ({ params }) => {
  // @ts-ignore
  return new Response(await KV.get(`round-${params.id}`))
})

// 404 for everything else
router.all(
  '*',
  () => new Response("uh, nope. couldn't find that.", { status: 404 })
)

addEventListener('fetch', (event) =>
  event.respondWith(router.handle(event.request))
)

addEventListener('scheduled', (event) => {
  event.waitUntil(handleCron(event))
})
