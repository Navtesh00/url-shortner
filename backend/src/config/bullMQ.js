import { Queue } from "bullmq";
import client from "./redis.js";

const isProduction = process.env.NODE_ENV === "production";

const baseJobOptions = {
    removeOnComplete: true,
    removeOnFail: false,
};

export const visitJobsQueue = new Queue("visit-jobs", {
  connection: client,
  defaultJobOptions: {
    ...baseJobOptions,
    attempts: isProduction ? 5 : 2,
    backoff: { type: "exponential", delay: isProduction ? 1000 : 2000 },
  },
});

export const flushJobsQueue = new Queue("flush-jobs", {
  connection: client,
  defaultJobOptions: {
    ...baseJobOptions,
    attempts: isProduction ? 5 : 2,
    backoff: { type: "exponential", delay: isProduction ? 1000 : 2000 },
  },
});
