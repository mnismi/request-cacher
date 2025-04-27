import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Redis } from 'ioredis'
import { cacheMiddleware, initialize } from '@mnismi/request-cacher/hono'
import { createMiddleware } from 'hono/factory'

const redis = new Redis({
  host: 'localhost',
  port: 6379,
})

initialize({ client: redis })

const app = new Hono()

const test = createMiddleware(async (c, next) => {
  console.log('test')
  await next()

  const resData = await c.res.clone().json()
  console.log(resData)
})

app.get(
  '/test2',
  // test,

  cacheMiddleware({ revalidateIn: 10 }),
  //  cacheMiddleware({ revalidateIn: 10 }),

  async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 5000))

    return c.json({
      message: 'Hello, World!',
    })
  },
)

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
