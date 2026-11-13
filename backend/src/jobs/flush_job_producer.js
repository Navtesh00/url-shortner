import { flushJobsQueue } from "../config/bullMQ.js";
import { FLUSH_VISIT_COUNTS } from "./job_names.js";

const WINDOW_SECONDS = 60;

const windowStart = () => Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;

export const produceFlushJob = async (code) => {
    const ws = windowStart();
    return flushJobsQueue.add(FLUSH_VISIT_COUNTS, { windowStart: ws });
}
