// Simple in-memory cache for API responses (per server instance)
// For production, use Redis or a persistent cache

const cache: Record<string, { data: any; expires: number }> = {};

export function getCached(key: string): any | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

export function setCached(key: string, data: any, ttlMs: number) {
  cache[key] = { data, expires: Date.now() + ttlMs };
}
