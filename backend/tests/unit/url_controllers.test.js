jest.mock("../../src/services/url_service.js", () => ({
    createShortUrl: jest.fn(),
    resolveLongUrl: jest.fn(),
    getUrlStats: jest.fn(),
}));
jest.mock("../../src/jobs/visit_job_producer.js", () => ({
    enqueueVisitJob: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../src/utils/validators.js", () => ({
    isValidUrl: jest.fn(() => true),
}));

import { shortenUrl, redirectToLongUrl, fetchUrlStats } from "../../src/controllers/url_controllers.js";
import { createShortUrl, resolveLongUrl, getUrlStats } from "../../src/services/url_service.js";
import { enqueueVisitJob } from "../../src/jobs/visit_job_producer.js";
import { isValidUrl } from "../../src/utils/validators.js";
import { AppError } from "../../src/utils/errors.js";

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
};

describe("url_controllers", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("shortenUrl", () => {
        it("returns 201 with message and url on success", async () => {
            const doc = { _id: "id1", longURL: "https://example.com", shortURL: "AAAAAA", totalVisits: 0 };
            createShortUrl.mockResolvedValue(doc);
            const req = { body: { longURL: "https://example.com" } };
            const res = mockRes();

            await shortenUrl(req, res);

            expect(isValidUrl).toHaveBeenCalledWith("https://example.com");
            expect(createShortUrl).toHaveBeenCalledWith("https://example.com");
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "URL shortened successfully",
                url: doc,
            });
        });

        it("throws 400 when longURL is invalid", async () => {
            isValidUrl.mockReturnValue(false);
            const req = { body: { longURL: "not-a-url" } };
            const res = mockRes();

            await expect(shortenUrl(req, res)).rejects.toMatchObject({
                message: "Please provide a valid longURL",
                statusCode: 400,
            });
            expect(createShortUrl).not.toHaveBeenCalled();
        });

        it("throws 400 when longURL is missing", async () => {
            const req = { body: {} };
            const res = mockRes();

            await expect(shortenUrl(req, res)).rejects.toMatchObject({
                message: "Please provide a valid longURL",
                statusCode: 400,
            });
        });

        it("propagates errors from createShortUrl", async () => {
            isValidUrl.mockReturnValue(true);
            const err = new AppError("Db failure", 500);
            createShortUrl.mockRejectedValue(err);
            const req = { body: { longURL: "https://example.com" } };
            const res = mockRes();

            await expect(shortenUrl(req, res)).rejects.toBe(err);
        });
    });

    describe("redirectToLongUrl", () => {
        it("enqueues a visit job and returns 302 redirect", async () => {
            const url = { _id: "id1", longURL: "https://example.com" };
            resolveLongUrl.mockResolvedValue(url);
            const req = { params: { code: "AAAAAA" } };
            const res = mockRes();

            await redirectToLongUrl(req, res);

            expect(resolveLongUrl).toHaveBeenCalledWith("AAAAAA");
            expect(enqueueVisitJob).toHaveBeenCalledWith({
                urlId: "id1",
                shortCode: "AAAAAA",
                visitedAt: expect.any(Date),
            });
            expect(res.redirect).toHaveBeenCalledWith(302, "https://example.com");
        });

        it("swallows visit job enqueue errors (fire-and-forget)", async () => {
            const url = { _id: "id1", longURL: "https://example.com" };
            resolveLongUrl.mockResolvedValue(url);
            enqueueVisitJob.mockRejectedValue(new Error("redis down"));
            const req = { params: { code: "AAAAAA" } };
            const res = mockRes();

            await redirectToLongUrl(req, res);
            expect(res.redirect).toHaveBeenCalledWith(302, "https://example.com");
        });

        it("throws 400 for an invalid code", async () => {
            const err = new AppError("Please provide a valid code", 400);
            resolveLongUrl.mockRejectedValue(err);
            const req = { params: { code: "bad" } };
            const res = mockRes();

            await expect(redirectToLongUrl(req, res)).rejects.toMatchObject({
                message: "Please provide a valid code",
                statusCode: 400,
            });
            expect(enqueueVisitJob).not.toHaveBeenCalled();
        });

        it("throws 404 when URL is not found", async () => {
            const err = new AppError("UR not found", 404);
            resolveLongUrl.mockRejectedValue(err);
            const req = { params: { code: "AAAAAA" } };
            const res = mockRes();

            await expect(redirectToLongUrl(req, res)).rejects.toMatchObject({
                message: "UR not found",
                statusCode: 404,
            });
        });
    });

    describe("fetchUrlStats", () => {
        it("returns 200 with message and url on success", async () => {
            const doc = { _id: "id1", longURL: "https://example.com", shortURL: "AAAAAA", totalVisits: 5 };
            getUrlStats.mockResolvedValue(doc);
            const req = { params: { code: "AAAAAA" } };
            const res = mockRes();

            await fetchUrlStats(req, res);

            expect(getUrlStats).toHaveBeenCalledWith("AAAAAA");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "URL found", url: doc });
        });

        it("throws 400 for an invalid code", async () => {
            const err = new AppError("Please provide a valid code", 400);
            getUrlStats.mockRejectedValue(err);
            const req = { params: { code: "bad" } };
            const res = mockRes();

            await expect(fetchUrlStats(req, res)).rejects.toMatchObject({
                message: "Please provide a valid code",
                statusCode: 400,
            });
        });

        it("throws 404 when URL is not found", async () => {
            const err = new AppError("URL not found", 404);
            getUrlStats.mockRejectedValue(err);
            const req = { params: { code: "AAAAAA" } };
            const res = mockRes();

            await expect(fetchUrlStats(req, res)).rejects.toMatchObject({
                message: "URL not found",
                statusCode: 404,
            });
        });
    });
});