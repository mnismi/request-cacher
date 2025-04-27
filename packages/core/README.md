# @mnismi/request-cacher 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> SWR (Stale-While-Revalidate) Middleware for Hono.js / Express.js

## Installation 📦

```bash
# Using npm
npm install @mnismi/request-cacher ioredis

# Using yarn
yarn add @mnismi/request-cacher ioredis

# Using pnpm
pnpm add @mnismi/request-cacher ioredis
```

## Quick Start 🏁

### Hono Example

```typescript
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Redis } from 'ioredis'
import { cacheMiddleware, initialize } from '@mnismi/request-cacher/hono'

// Setup Redis client
const redis = new Redis({
  host: 'localhost',
  port: 6379,
})

// Initialize the cache system with Redis client
initialize({ client: redis })

const app = new Hono()

// Apply caching to specific routes
app.get(
  '/api/data',
  cacheMiddleware({ revalidateIn: 60 }), // Cache expires in 60 seconds
  async (c) => {
    // Expensive data fetching operation
    const data = await fetchExpensiveData()
    return c.json(data)
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
```

## Configuration Options 🔧

### Initialization

```typescript
initialize({
  client: redisClient, // Required: Redis client instance
  revalidateIn: 60, // Optional: Default TTL in seconds (default: 60)
  log: true, // Optional: Enable logging (default: true)
  keyPrefix: 'my-cache', // Optional: Redis key prefix (default: 'request-cacher')
})
```

### Middleware Options

```typescript
cacheMiddleware({
  revalidateIn: 30, // Override the global TTL for this route (in seconds)
  log: false, // Override the global logging setting for this route
})
```

## How It Works 🔍

1. When a request is received, the middleware checks if a cached response exists
2. If fresh cache exists (within TTL), it's returned immediately
3. If stale cache exists (beyond TTL), it's returned while a background process updates the cache
4. If no cache exists, the request is processed normally and the result is cached

This approach ensures users always get a fast response while keeping data as fresh as possible.

## License 📄

MIT © [mnismi](https://github.com/mnismi)
