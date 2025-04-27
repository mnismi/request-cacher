import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { testExpress } from '@mnismi/request-cacher/express'

const app = new Hono()

app.get('/', (c) => {
  const test = testExpress()

  return c.text(test)
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
