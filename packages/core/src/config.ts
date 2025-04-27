import { Redis } from 'ioredis'

let redisClient: Redis | null = null
let revalidateIn: number | null = null

export function initialize({ client, revalidateIn }: { client: Redis; revalidateIn?: number }): Redis {
  console.log('Initializing request cacher')
  redisClient = client
  revalidateIn = revalidateIn
  return redisClient
}

export function getConfig(): { redisClient: Redis; revalidateIn: number | null } {
  if (!redisClient) {
    throw new Error('initializeRedis.')
  }
  return { redisClient: redisClient, revalidateIn: revalidateIn }
}
