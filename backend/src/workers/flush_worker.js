import URL from "../models/url_models.js";
import client from "../config/redis.js";
import { bufferKey, dirtyKey, flushKey } from "../services/url_cache_service.js";

const WINDOW_SECONDS = 60;

const windowStart = () => Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;

export const processFlushJob = async (job) => {
    const { windowStart: ws } = job.data;

    let cursor = "0";
    do {
        const [nextCursor, members] = await client.sscan(dirtyKey, cursor, "COUNT", 100);
        cursor = nextCursor;

        for (const code of members) {
            const buffer = bufferKey(code);
            const flush = flushKey(code, ws);

            let claimed = false;
            try {
                await client.rename(buffer, flush);
                claimed = true;
            } catch (err) {
                if (err.message && err.message.includes("no such key")) {
                    await client.srem(dirtyKey, code);
                    continue;
                }
                throw err;
            }

            const countRaw = await client.get(flush);
            const count = parseInt(countRaw, 10) || 0;

            if (count > 0) {
                await URL.findOneAndUpdate(
                    { shortURL: code },
                    { $inc: { totalVisits: count }, $set: { lastVisitedAt: new Date() } },
                );
            }

            await client.del(flush);
            await client.srem(dirtyKey, code);
        }
    } while (cursor !== "0");

    return { windowStart: ws };
}
