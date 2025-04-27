import { createMiddleware } from 'hono/factory'
import { initialize, getConfig } from '../config'

function cacheMiddleware({ revalidateIn }: { revalidateIn?: number } = {}) {
  return createMiddleware(async (c, next) => {
    const { redisClient, revalidateIn: globalRevalidateIn } = getConfig()

    const ttl = revalidateIn || globalRevalidateIn || 60
    const url = new URL(c.req.url)
    const cacheKey = `cache:${c.req.method}:${url.pathname}${url.search}`

    // console.log(`[Cache] Cache Key: ${cacheKey}`)

    // Check if we have cached data
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
      const parsed = JSON.parse(cachedData)
      const now = Date.now() / 1000
      const age = now - parsed.timestamp

      // console.log(
      //   `[Cache] Cache found, age: ${age.toFixed(2)}s, ttl: ${ttl}s, status: ${age < ttl ? 'fresh' : 'stale'}`,
      // )

      // console.log(`[Cache Hit]: ${cacheKey}`)

      // If cache is fresh, return immediately
      if (age < ttl) {
        console.log(`[Cache Hit / Fresh]: age: ${age.toFixed(2)}s/${ttl}s ${cacheKey}`)
        return c.json(parsed.data)
      }

      // If cache is stale, serve stale data immediately and refresh in background
      // console.log(`[Cache] Serving stale data while revalidating in background`)
      // c.json(parsed.data)

      console.log(`[Cache Hit / Stale]: age: ${age.toFixed(2)}s/${ttl}s ${cacheKey}`)

      // Update cache in the background
      if (!parsed.revalidating) {
        await redisClient.set(
          cacheKey,
          JSON.stringify({
            ...parsed,
            revalidating: true,
          }),
        )
        queueMicrotask(async () => {
          console.log(`[Revalidate Started]: ${cacheKey}`)
          await next()
          const responseData = await c.res.clone().json()

          await redisClient.set(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now() / 1000,
              revalidating: false,
              data: responseData,
            }),
          )
          console.log(`[Revalidate Complete]: ${cacheKey}`)
        })
      }

      return c.json(parsed.data)
    }

    // No cache exists: fetch, cache, and return
    console.log(`[Cache Miss]: ${cacheKey}`)
    await next()

    // Get the response data
    const responseData = await c.res.clone().json()

    // Cache the response
    await redisClient.set(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now() / 1000,
        revalidating: false,
        data: responseData,
      }),
    )
    console.log(`[Cached]: ${cacheKey}`)
  })
}

export { initialize, getConfig, cacheMiddleware }
