import client from "../config/redis.js";

const CACHE_TTL_SECONDS = 60 * 60 * 24;

const cacheKey = (code) => `${process.env.REDIS_KEY_PREFIX}:url:${code}`;

export const getCachedUrl = async (code) => {
    const key = cacheKey(code);
    const longURL = await client.hget(key, "longURL");

    if (!longURL) return null;

    await client.hincrby(key, "totalVisits", 1);

    return longURL;
}

export const cacheUrl = async (code, { longURL, totalVisits, lastVisitedAt }) => {
    const key = cacheKey(code);

    await client.hset(key, {
        longURL,
        totalVisits,
        lastVisitedAt,
    });

    await client.expire(key, CACHE_TTL_SECONDS);
}
