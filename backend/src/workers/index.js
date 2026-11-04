import { Worker } from "bullmq";
import client from "../config/redis.js";
import { processVisitJob } from "./visit_worker.js";

export const visitWorker = new Worker(
  "visit-jobs",
  processVisitJob,
  {
    connection: client,
    concurrency: 10,
  }
);

visitWorker.on("completed", (job) => {
  console.log(`Visit job ${job.id} completed`);
});

visitWorker.on("failed", (job, err) => {
  console.error(`Visit job ${job.id} failed`, err);
});
