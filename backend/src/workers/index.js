import { Worker } from "bullmq";
import client from "../config/redis.js";
import { processFlushJob } from "./flush_worker.js";
import { logger } from "../utils/logger.js";

export const flushWorker = new Worker(
  "flush-jobs",
  processFlushJob,
  {
    connection: client,
    concurrency: 1,
  }
);

flushWorker.on("completed", (job) => {
  logger.info(`Flush job ${job.id} completed`);
});

flushWorker.on("failed", (job, err) => {
  logger.error(`Flush job ${job.id} failed`, err);
});
