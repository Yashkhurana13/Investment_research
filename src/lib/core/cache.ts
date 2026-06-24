export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds: number): Promise<void>;
}

export class MemoryCache implements CacheProvider {
  private cache = new Map<string, { data: string; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return JSON.parse(item.data);
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      data: JSON.stringify(value),
      expiry: Date.now() + ttlSeconds * 1000
    });
  }
}

// Optionally implement RedisCache if REDIS_URL is present, but for now we default to MemoryCache
export class RedisCache implements CacheProvider {
  // Skeleton for future use
  async get<T>(key: string): Promise<T | null> { return null; }
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {}
}

export const defaultCache = new MemoryCache();
