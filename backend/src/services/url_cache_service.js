import client from "../config/redis.js";
import Url from "../models/url_models.js";

const CACHE_TTL_SECONDS = 60 * 60 * 24;
const CACHE_NOT_FOUND_TTL_SECONDS = 60 * 30;

const key_prefix = (process.env.KEY_PREFIX || "urlShortener:dev")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/;+$/, "")
    .trim() || "urlShortener:dev";

const cacheKey = (code) => `${key_prefix}:url:${code}`;
const cacheNotFoundKey = (code) => `${key_prefix}:notFound:${code}`;

/** Returns the full record (or null), never a bare string. */
export const getCachedUrl = async (code) => {
    const key = cacheKey(code);
    const raw = await client.get(key);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/** Stores the full record so stats and redirects share one shape. */
export const setCacheUrl = async (code, url) => {
    const key = cacheKey(code);
    const record = {
        _id: url._id,
        longURL: url.longURL,
        shortURL: url.shortURL,
        totalVisits: url.totalVisits ?? 0,
        lastVisitedAt: url.lastVisitedAt ?? null,
    };

    await client.set(key, JSON.stringify(record), "EX", CACHE_TTL_SECONDS);
}

export const getCachedNotFoundUrl = async (code) => {
    const key = cacheNotFoundKey(code);
    return Boolean(await client.exists(key))
}

export const setCacheNotFoundUrl = async (code) => {
    const key = cacheNotFoundKey(code);
    await client.set(key, "1", "EX", CACHE_NOT_FOUND_TTL_SECONDS);
}