import { handleCron } from './lib/cron'
import { mineTokens } from './lib/mineTokens'

addEventListener('fetch', (event) => {
  event.respondWith(mineTokens())
})

addEventListener('scheduled', (event) => {
  event.waitUntil(handleCron(event))
})
