import Redis from "ioredis";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";
dotenv.config();

const client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null,
});

client.on("connect", () => {
    logger.info("Redis connected");
});

client.on("error", (err) => {
    logger.error("Redis error", err);
});

export const validateRedisConfig = async () => {
    if (process.env.NODE_ENV !== "production") {
        logger.info("Skipping Redis config validation in non-production environment");
        return;
    }

    const appendonly = await client.config("GET", "appendonly");
    const maxmemoryPolicy = await client.config("GET", "maxmemory-policy");
    const maxmemory = await client.config("GET", "maxmemory");

    const appendonlyVal = appendonly[1];
    const policyVal = maxmemoryPolicy[1];
    const maxmemoryVal = parseInt(maxmemory[1], 10);

    if (appendonlyVal !== "yes") {
        throw new Error(`Redis appendonly must be "yes", got "${appendonlyVal}"`);
    }
    if (policyVal !== "volatile-lru") {
        throw new Error(`Redis maxmemory-policy must be "volatile-lru", got "${policyVal}"`);
    }
    if (maxmemoryVal === 0) {
        throw new Error("Redis maxmemory must be set to a non-zero value");
    }

    logger.info("Redis config validated", { appendonly: "yes", "maxmemory-policy": "volatile-lru", maxmemory: maxmemoryVal });
};

export default client;
