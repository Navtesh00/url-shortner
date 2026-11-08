jest.mock("../../src/config/bullMQ.js", () => ({
    visitJobsQueue: {
        add: jest.fn(),
    },
}));

import { enqueueVisitJob } from "../../src/jobs/visit_job_producer.js";
import { visitJobsQueue } from "../../src/config/bullMQ.js";
import { UPDATE_VISIT_COUNT } from "../../src/jobs/job_names.js";

describe("enqueueVisitJob (job producer)", () => {
    beforeEach(() => jest.clearAllMocks());

    it("adds a job to the visit-jobs queue with the correct name and data", async () => {
        const jobData = { urlId: "id1", shortCode: "AAAAAA", visitedAt: new Date() };
        visitJobsQueue.add.mockResolvedValue({ id: "job-123" });

        const result = await enqueueVisitJob(jobData);

        expect(visitJobsQueue.add).toHaveBeenCalledWith(UPDATE_VISIT_COUNT, jobData);
        expect(result).toEqual({ id: "job-123" });
    });

    it("uses the UPDATE_VISIT_COUNT job name constant", async () => {
        visitJobsQueue.add.mockResolvedValue({ id: "job-1" });
        await enqueueVisitJob({ urlId: "id1", shortCode: "ABC123", visitedAt: new Date() });

        expect(visitJobsQueue.add).toHaveBeenCalledWith("update-visit-count", expect.any(Object));
    });

    it("propagates errors from the queue (e.g. Redis down)", async () => {
        const err = new Error("redis connection failed");
        visitJobsQueue.add.mockRejectedValue(err);

        await expect(
            enqueueVisitJob({ urlId: "id1", shortCode: "AAAAAA", visitedAt: new Date() })
        ).rejects.toBe(err);
    });
});