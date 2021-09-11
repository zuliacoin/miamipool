import { handleCron } from './lib/cron'

addEventListener('fetch', (event) => {
  event.respondWith(new Response("hello"))
})

addEventListener('scheduled', (event) => {
  event.waitUntil(handleCron(event))
})
