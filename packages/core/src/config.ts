import { Redis } from 'ioredis'

let _redisClient: Redis | null = null
let _revalidateIn: number | null = null
let _log: boolean = true
let _keyPrefix: string = 'request-cacher'

export function initialize({
  client,
  revalidateIn,
  log,
  keyPrefix,
}: {
  client: Redis
  revalidateIn?: number
  log?: boolean
  keyPrefix?: string
}) {
  if (client) {
    _redisClient = client
  }

  if (revalidateIn) {
    _revalidateIn = revalidateIn
  }

  if (typeof log === 'boolean') {
    _log = log
  }

  if (typeof keyPrefix === 'string') {
    _keyPrefix = keyPrefix
  }
}

export function getConfig() {
  if (!_redisClient) {
    throw new Error('initializeRedis.')
  }

  return { redisClient: _redisClient, revalidateIn: _revalidateIn, log: _log, keyPrefix: _keyPrefix }
}
