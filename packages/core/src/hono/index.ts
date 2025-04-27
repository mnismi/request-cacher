import { createMiddleware } from "hono/factory";

// Storage interface for caching
export interface CacheStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

// Memory storage implementation
export class MemoryStorage implements CacheStorage {
  private storage = new Map<string, { value: any; expires: number }>();

  async get(key: string): Promise<any> {
    const item = this.storage.get(key);
    if (!item) return null;
    if (item.expires < Date.now()) {
      this.storage.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: any, ttl = 0): Promise<void> {
    const expires = ttl ? Date.now() + ttl * 1000 : Infinity;
    this.storage.set(key, { value, expires });
  }

  async has(key: string): Promise<boolean> {
    const item = this.storage.get(key);
    if (!item) return false;
    if (item.expires < Date.now()) {
      this.storage.delete(key);
      return false;
    }
    return true;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

// Redis storage implementation
export class RedisStorage implements CacheStorage {
  private client: any;

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl = 0): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, serialized, "EX", ttl);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async has(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}

export interface RevalidateOptions {
  seconds: number;
  storage?: CacheStorage;
}

export function swrMiddleware(options: RevalidateOptions | number) {
  const seconds = typeof options === "number" ? options : options.seconds;
  const storage =
    typeof options === "object" && options.storage
      ? options.storage
      : new MemoryStorage();

  return createMiddleware(async (c, next) => {
    // Cache key generation based on request URL and method
    const cacheKey = `${c.req.method}:${c.req.url}`;

    // Check if response is cached
    if (c.req.method === "GET") {
      const cachedResponse = await storage.get(cacheKey);
      if (cachedResponse) {
        // Return cached response
        return new Response(cachedResponse.body, {
          headers: new Headers(cachedResponse.headers),
          status: cachedResponse.status,
        });
      }
    }

    await next();

    // Cache the response
    if (c.req.method === "GET" && c.res.ok) {
      const clonedResponse = c.res.clone();
      const body = await clonedResponse.text();
      const headers = Object.fromEntries(clonedResponse.headers.entries());

      await storage.set(
        cacheKey,
        {
          body,
          headers,
          status: clonedResponse.status,
        },
        seconds
      );
    }

    c.res.headers.set(
      "Cache-Control",
      `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds}`
    );
  });
}
