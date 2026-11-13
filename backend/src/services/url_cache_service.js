import client from "../config/redis.js";

const CACHE_TTL_SECONDS = 60 * 60 * 24;
const CACHE_NOT_FOUND_TTL_SECONDS = 60 * 30;

const key_prefix = (process.env.KEY_PREFIX || "urlShortener:dev")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/;+$/, "")
    .trim() || "urlShortener:dev";

export const cacheKey = (code) => `${key_prefix}:url:${code}`;
export const cacheNotFoundKey = (code) => `${key_prefix}:notFound:${code}`;
export const bufferKey = (code) => `${key_prefix}:buffer:${code}`;
export const dirtyKey = `${key_prefix}:dirty`;
export const flushKey = (code, windowStart) => `${key_prefix}:flush:${code}:${windowStart}`;

/** Returns the bare long URL string (or null), never JSON. */
export const getCachedUrl = async (code) => {
    const key = cacheKey(code);
    const raw = await client.get(key);
    if (!raw) return null;
    return raw;
}

/** Stores the bare long URL string with a TTL. Always sets EX. */
export const setCache = async (code, longURL) => {
    const key = cacheKey(code);
    await client.set(key, longURL, "EX", CACHE_TTL_SECONDS);
}

/** Increments the per-code visit buffer. Never sets a TTL. */
export const bufferIncr = async (code) => {
    return await client.incr(bufferKey(code));
}

/** Marks a code as dirty (pending flush). No TTL. */
export const markDirty = async (code) => {
    await client.sadd(dirtyKey, code);
}

/** Negative cache: returns true when the not-found marker exists. */
export const getCachedNotFoundUrl = async (code) => {
    const key = cacheNotFoundKey(code);
    return Boolean(await client.exists(key));
}

/** Negative cache: sets a short-lived marker. */
export const setCacheNotFoundUrl = async (code) => {
    const key = cacheNotFoundKey(code);
    await client.set(key, "1", "EX", CACHE_NOT_FOUND_TTL_SECONDS);
}
