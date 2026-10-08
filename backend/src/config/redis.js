import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

client.on("connect", () => {
    console.log("Redis connected");
})

client.on("error", (err) => {
    console.log("Redis error :", err);
})

export default client;