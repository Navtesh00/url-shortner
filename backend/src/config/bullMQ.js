import { Queue, Worker } from "bullmq";

const connection = { host: 'localhost', port: 6379 };

// --------------------------------------------------------------------------
// 1. Queue for dispatching jobs
// --------------------------------------------------------------------------
export const jobQueue = new Queue('redis-job-queue', connection);

// --------------------------------------------------------------------------
// 2. Worker for processing jobs
// --------------------------------------------------------------------------
const worker = new Worker(
    'redis-job-queue',
    async job => {
        console.log('⚡ Processing job:', job.name, job.data);

        // --- Your Business Logic Here ---
        // Example: if job.name === "send-email":
        //   await sendEmail(job.data.to, job.data.subject, job.data.text);
        // --------------------------------

        return { status: 'completed', result: 'Processed successfully' };
    },
    connection
);

// --------------------------------------------------------------------------
// 4. Graceful Shutdown (important!)
// --------------------------------------------------------------------------
export async function shutdownWorker() {
    await worker.close();
    console.log(' worker closed');
}
