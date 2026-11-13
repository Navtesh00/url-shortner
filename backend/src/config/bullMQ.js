import { Queue } from "bullmq";
import client from "./redis.js";

export const visitJobsQueue = new Queue("visit-jobs", {
  connection: client,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const flushJobsQueue = new Queue("flush-jobs", {
  connection: client,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
