import { flushJobsQueue } from "../config/bullMQ.js";
import { FLUSH_VISIT_COUNTS } from "./job_names.js";
import { logger } from "../utils/logger.js";

const WINDOW_SECONDS = 60;
const SCHEDULER_INTERVAL_MS = 10 * 60 * 1000;

const windowStart = () => Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;

let timer = null;

export const startFlushScheduler = () => {
    if (timer) return;

    const tick = async () => {
        try {
            const ws = windowStart();
            await flushJobsQueue.add(FLUSH_VISIT_COUNTS, { windowStart: ws });
        } catch (err) {
            logger.error("Flush scheduler tick failed", err);
        }
    };

    tick();
    timer = setInterval(tick, SCHEDULER_INTERVAL_MS);
    timer.unref();
};

export const stopFlushScheduler = () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
};
