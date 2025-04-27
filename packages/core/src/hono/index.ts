import { createMiddleware } from 'hono/factory'
import { initialize, getConfig } from '../config'

function cacheMiddleware({ revalidateIn, log }: { revalidateIn?: number; log?: boolean } = {}) {
  return createMiddleware(async (c, next) => {
    const { redisClient, revalidateIn: globalRevalidateIn, log: globalLog, keyPrefix } = getConfig()

    const _log = log || globalLog
    const ttl = revalidateIn || globalRevalidateIn || 60
    const url = new URL(c.req.url)
    const cacheKey = `${keyPrefix}:${c.req.method}:${url.pathname}${url.search}`

    // Check if we have cached data
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
      const parsed = JSON.parse(cachedData)
      const now = Date.now() / 1000
      const age = now - parsed.timestamp

      // If cache is fresh, return immediately
      if (age < ttl) {
        _log && console.log(`[Cache Hit / Fresh]: age: ${age.toFixed(2)}s/ ttl: ${ttl}s ${cacheKey}`)
        return c.json(parsed.data)
      }

      _log && console.log(`[Cache Hit / Stale]: age: ${age.toFixed(2)}s/ ttl: ${ttl}s ${cacheKey}`)

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
          _log && console.log(`[Revalidate Started]: ${cacheKey}`)
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
          _log && console.log(`[Revalidate Complete]: ${cacheKey}`)
        })
      } else {
        // fail safe: if the revalidation is true for more than 60 seconds, make it false
        if (ttl + 60 < age) {
          await redisClient.set(
            cacheKey,
            JSON.stringify({
              ...parsed,
              revalidating: false,
            }),
          )
        }
      }

      return c.json(parsed.data)
    }

    // No cache exists: fetch, cache, and return
    _log && console.log(`[Cache Miss]: ${cacheKey}`)
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
    _log && console.log(`[Cached]: ${cacheKey}`)
  })
}

export { initialize, getConfig, cacheMiddleware }
