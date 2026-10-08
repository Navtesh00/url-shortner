import client from "../config/redis.js";
import Url from "../models/url_models.js";

const CACHE_TTL_SECONDS = 60 * 60 * 24;
const CACHE_NOT_FOUND_TTL_SECONDS = 60 * 30;

const key_prefix = "urlShortener:dev";

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
        longURL: url.longURL,
        shortURL: url.shortURL,
        totalVisits: url.totalVisits ?? 0,
        lastVisitedAt: url.lastVisitedAt ?? null,
    };

    await client.hset(key, record);
}

/** Fire-and-forget: keep the visit counter climbing even on cached redirects. */
export const touchVisits = (code) => {
    Url.findOneAndUpdate(
        { shortURL: code }, 
        { $inc: { totalVisits: 1 }, $set: { lastVisitedAt: new Date() } },
        { returnDocument: 'after' }
    )
        .then((updated) => {
            if (updated) setCacheUrl(code, updated).catch(() => { });
        })
        .catch(() => { });
};

export const getCachedNotFoundUrl = async (code) => {
    const key = cacheNotFoundKey(code);
    return Boolean(await client.exists(key))
}

export const setCacheNotFoundUrl = async (code) => {
    const key = cacheNotFoundKey(code);
    await client.set(key, "1", "EX", CACHE_NOT_FOUND_TTL_SECONDS);
}