jest.mock("../../src/models/url_models.js", () => ({
    findOneAndUpdate: jest.fn(),
}));
jest.mock("../../src/config/redis.js", () => ({
    sscan: jest.fn(),
    rename: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    srem: jest.fn(),
}));

import client from "../../src/config/redis.js";
import URL from "../../src/models/url_models.js";
import { processFlushJob } from "../../src/workers/flush_worker.js";

describe("flush_worker", () => {
    beforeEach(() => jest.clearAllMocks());

    it("processes dirty codes via SSCAN and RENAME, SREMs only after $inc", async () => {
        client.sscan.mockResolvedValueOnce(["0", ["abc", "def"]]);
        client.rename.mockResolvedValue("OK");
        client.get.mockResolvedValue("3");
        URL.findOneAndUpdate.mockResolvedValue({});

        const job = { data: { windowStart: 1000 } };
        const result = await processFlushJob(job);

        expect(client.sscan).toHaveBeenCalledWith(expect.stringContaining(":dirty"), "0", "COUNT", 100);
        expect(client.rename).toHaveBeenCalledWith(
            expect.stringContaining(":buffer:abc"),
            expect.stringContaining(":flush:abc:1000"),
        );
        expect(URL.findOneAndUpdate).toHaveBeenCalledWith(
            { shortURL: "abc" },
            { $inc: { totalVisits: 3 }, $set: { lastVisitedAt: expect.any(Date) } },
        );
        expect(client.del).toHaveBeenCalledWith(expect.stringContaining(":flush:abc:1000"));
        expect(client.srem).toHaveBeenCalledWith(expect.stringContaining(":dirty"), "abc");
        expect(result).toEqual({ windowStart: 1000 });
    });

    it("treats RENAME no-such-key as stale member: SREM dirty and continue", async () => {
        const err = new Error("no such key");
        client.sscan.mockResolvedValueOnce(["0", ["abc"]]);
        client.rename.mockRejectedValue(err);
        client.srem.mockResolvedValue(1);

        await processFlushJob({ data: { windowStart: 1000 } });

        expect(client.srem).toHaveBeenCalledWith(expect.stringContaining(":dirty"), "abc");
        expect(URL.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("propagates non-no-such-key RENAME errors", async () => {
        const err = new Error("connection error");
        client.sscan.mockResolvedValueOnce(["0", ["abc"]]);
        client.rename.mockRejectedValue(err);

        await expect(processFlushJob({ data: { windowStart: 1000 } })).rejects.toThrow("connection error");
    });

    it("does not $inc when count is zero or missing", async () => {
        client.sscan.mockResolvedValueOnce(["0", ["abc"]]);
        client.rename.mockResolvedValue("OK");
        client.get.mockResolvedValue("0");

        await processFlushJob({ data: { windowStart: 1000 } });

        expect(URL.findOneAndUpdate).not.toHaveBeenCalled();
    });
});
