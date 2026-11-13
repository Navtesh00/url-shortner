import dotenv from "dotenv";
import mongoose from "mongoose";
import databaseConnection from "./src/config/db.js";
import { validateRedisConfig } from "./src/config/redis.js";
import { flushWorker } from "./src/workers/index.js";
import { startFlushScheduler, stopFlushScheduler } from "./src/jobs/flush_scheduler.js";

dotenv.config({ path: "./.env" });

await validateRedisConfig();
await databaseConnection();

startFlushScheduler();

const shutdown = async () => {
  stopFlushScheduler();
  await flushWorker.close();
  await mongoose.disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
