import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null,
});

client.on("connect", () => {
    console.log("Redis connected");
});

client.on("error", (err) => {
    console.log("Redis error :", err);
});

export const validateRedisConfig = async () => {
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

    console.log("Redis config validated: appendonly=yes, maxmemory-policy=volatile-lru, maxmemory=" + maxmemoryVal);
};

export default client;
