jest.mock("../../src/models/url_models.js", () => ({
    findOneAndUpdate: jest.fn(),
}));

import { processVisitJob } from "../../src/workers/visit_worker.js";
import URL from "../../src/models/url_models.js";
import { UnrecoverableError } from "bullmq";

describe("processVisitJob (visit worker)", () => {
    beforeEach(() => jest.clearAllMocks());

    it("increments totalVisits and sets lastVisitedAt when URL exists", async () => {
        const updated = {
            _id: "id1",
            longURL: "https://example.com",
            shortURL: "AAAAAA",
            totalVisits: 1,
            lastVisitedAt: new Date("2026-01-01"),
        };
        URL.findOneAndUpdate.mockResolvedValue(updated);

        const job = { data: { urlId: "id1", shortCode: "AAAAAA", visitedAt: new Date("2026-01-01") } };

        const result = await processVisitJob(job);

        expect(URL.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: "id1" },
            { $inc: { totalVisits: 1 }, $set: { lastVisitedAt: job.data.visitedAt } },
            { new: true }
        );
        expect(result).toBe(updated);
    });

    it("throws UnrecoverableError when URL is not found", async () => {
        URL.findOneAndUpdate.mockResolvedValue(null);

        const job = { data: { urlId: "missing", shortCode: "AAAAAA", visitedAt: new Date() } };

        await expect(processVisitJob(job)).rejects.toBeInstanceOf(UnrecoverableError);
        await expect(processVisitJob(job)).rejects.toThrow(/URL not found: missing/);
    });

    it("passes through Mongo errors", async () => {
        const dbErr = new Error("connection lost");
        URL.findOneAndUpdate.mockRejectedValue(dbErr);

        const job = { data: { urlId: "id1", shortCode: "AAAAAA", visitedAt: new Date() } };

        await expect(processVisitJob(job)).rejects.toBe(dbErr);
    });
});