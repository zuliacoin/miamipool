import { handleCron } from './cron'
import { Router } from 'itty-router'

const router = Router()

router.get('/', () => {
  return new Response('eth small pp. bitcoin big pp. big, big pp', {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
})

router.get('/currentround', async () => {
  // @ts-ignore
  const currentRound = parseInt(await KV.get('currentRound'))

  return new Response(
    JSON.stringify({
      round: currentRound,
    }),
    {
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  )
})

router.get('/currentblock', async () => {
  // @ts-ignore
  const currentBlock = parseInt(await KV.get('currentBlock'))

  return new Response(
    JSON.stringify({
      block: currentBlock,
    }),
    {
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  )
})

router.get('/round/:id', async ({ params }) => {
  // @ts-ignore
  return new Response(await KV.get(`round-${params.id}`), {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
})

// 404 for everything else
router.all(
  '*',
  () =>
    new Response("uh, nope. couldn't find that.", {
      headers: { 'Access-Control-Allow-Origin': '*' },
      status: 404,
    })
)

addEventListener('fetch', (event) =>
  event.respondWith(router.handle(event.request))
)

addEventListener('scheduled', (event) => {
  event.waitUntil(handleCron(event))
})
