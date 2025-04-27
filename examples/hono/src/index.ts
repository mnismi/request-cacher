import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Redis } from 'ioredis'
import { cacheMiddleware, initialize } from '@mnismi/request-cacher/hono'

const redis = new Redis({
  host: 'localhost',
  port: 6379,
})

initialize({ client: redis })

const app = new Hono()

app.get(
  '/test',
  cacheMiddleware({ revalidateIn: 10 }),
  //  cacheMiddleware({ revalidateIn: 10 }),
  async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 5000))

    return c.json({
      message: 'Hello, World! /test',
    })
  },
)

app.get('/test2', cacheMiddleware({ revalidateIn: 20 }), async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return c.json({
    message: 'Hello, World! /test2',
  })
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
