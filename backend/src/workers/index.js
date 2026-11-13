import { Worker } from "bullmq";
import client from "../config/redis.js";
import { processVisitJob } from "./visit_worker.js";
import { processFlushJob } from "./flush_worker.js";

export const visitWorker = new Worker(
  "visit-jobs",
  processVisitJob,
  {
    connection: client,
    concurrency: 10,
  }
);

export const flushWorker = new Worker(
  "flush-jobs",
  processFlushJob,
  {
    connection: client,
    concurrency: 1,
  }
);

visitWorker.on("completed", (job) => {
  console.log(`Visit job ${job.id} completed`);
});

visitWorker.on("failed", (job, err) => {
  console.error(`Visit job ${job.id} failed`, err);
});

flushWorker.on("completed", (job) => {
  console.log(`Flush job ${job.id} completed`);
});

flushWorker.on("failed", (job, err) => {
  console.error(`Flush job ${job.id} failed`, err);
});
