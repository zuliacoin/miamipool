import { handleCron } from './cron'

addEventListener('fetch', (event) => {
  event.respondWith(new Response("this worker is a cron, not a HTTP handler :)"))
})

addEventListener('scheduled', (event) => {
  event.waitUntil(handleCron(event))
})
