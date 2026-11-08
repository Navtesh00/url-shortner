jest.mock("../../src/models/url_models.js", () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));
jest.mock("../../src/services/generate_code.js", () => jest.fn(() => "AAAAAA"));
jest.mock("../../src/services/url_cache_service.js", () => ({
    getCachedUrl: jest.fn(),
    getCachedNotFoundUrl: jest.fn(),
    setCacheUrl: jest.fn(),
    setCacheNotFoundUrl: jest.fn(),
}));
jest.mock("../../src/utils/validators.js", () => ({
    isValidCode: jest.fn((code) => typeof code === "string" && /^[a-zA-Z0-9]{6}$/.test(code)),
}));
jest.mock("../../src/utils/errors.js", () => ({
    AppError: class AppError extends Error {
        constructor(message, statusCode = 500) {
            super(message);
            this.statusCode = statusCode;
            this.name = "AppError";
        }
    },
}));

import Url from "../../src/models/url_models.js";
import {
    getCachedUrl,
    getCachedNotFoundUrl,
    setCacheUrl,
    setCacheNotFoundUrl,
} from "../../src/services/url_cache_service.js";
import { isValidCode } from "../../src/utils/validators.js";
import { AppError } from "../../src/utils/errors.js";
import { resolveLongUrl, getUrlStats } from "../../src/services/url_service.js";

describe("url_service cache-failure edge cases", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("resolveLongUrl — getCachedNotFoundUrl throws (outside try/catch → 500)", () => {
        it("propagates Redis errors from getCachedNotFoundUrl", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockRejectedValue(new Error("redis connection failed"));

            await expect(resolveLongUrl("AAAAAA")).rejects.toThrow("redis connection failed");
        });

        it("does not catch getCachedNotFoundUrl errors — known 500 risk", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockRejectedValue(new Error("redis down"));

            await expect(resolveLongUrl("AAAAAA")).rejects.toThrow("redis down");
        });
    });

    describe("resolveLongUrl — getCachedUrl throws (caught, falls through to Mongo)", () => {
        it("falls back to MongoDB when getCachedUrl throws", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockResolvedValue(false);
            getCachedUrl.mockRejectedValue(new Error("redis get failed"));

            const doc = { _id: "id1", longURL: "https://example.com", shortURL: "AAAAAA", totalVisits: 0 };
            Url.findOne.mockResolvedValue(doc);

            const result = await resolveLongUrl("AAAAAA");

            expect(Url.findOne).toHaveBeenCalledWith({ shortURL: "AAAAAA" });
            expect(result).toBe(doc);
        });
    });

    describe("resolveLongUrl — setCacheUrl throws (caught, still returns URL)", () => {
        it("returns the Mongo record even when setCacheUrl throws", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockResolvedValue(false);
            getCachedUrl.mockResolvedValue(null);
            setCacheUrl.mockRejectedValue(new Error("redis set failed"));

            const doc = { _id: "id1", longURL: "https://example.com", shortURL: "AAAAAA", totalVisits: 0 };
            Url.findOne.mockResolvedValue(doc);

            const result = await resolveLongUrl("AAAAAA");

            expect(result).toBe(doc);
        });
    });

    describe("getUrlStats — getCachedNotFoundUrl throws (outside try/catch → 500)", () => {
        it("propagates Redis errors from getCachedNotFoundUrl", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockRejectedValue(new Error("redis stats failed"));

            await expect(getUrlStats("AAAAAA")).rejects.toThrow("redis stats failed");
        });
    });

    describe("getUrlStats — setCacheUrl throws (caught, still returns stats)", () => {
        it("returns the Mongo record even when setCacheUrl throws", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockResolvedValue(false);
            setCacheUrl.mockRejectedValue(new Error("redis stats set failed"));

            const doc = { _id: "id1", longURL: "https://example.com", shortURL: "AAAAAA", totalVisits: 5 };
            Url.findOne.mockResolvedValue(doc);

            const result = await getUrlStats("AAAAAA");

            expect(result).toBe(doc);
        });
    });

    describe("resolveLongUrl — cache hit path", () => {
        it("returns cached record without calling Mongo when cache has _id", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockResolvedValue(false);
            getCachedUrl.mockResolvedValue({ _id: "cached-id", longURL: "https://cached.com", shortURL: "AAAAAA" });

            const result = await resolveLongUrl("AAAAAA");

            expect(result).toEqual({ _id: "cached-id", longURL: "https://cached.com", shortURL: "AAAAAA" });
            expect(Url.findOne).not.toHaveBeenCalled();
        });

        it("falls through to Mongo when cached record has no _id", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockResolvedValue(false);
            getCachedUrl.mockResolvedValue({ longURL: "https://no-id.com" });

            const doc = { _id: "id1", longURL: "https://example.com", shortURL: "AAAAAA", totalVisits: 0 };
            Url.findOne.mockResolvedValue(doc);

            const result = await resolveLongUrl("AAAAAA");

            expect(Url.findOne).toHaveBeenCalledWith({ shortURL: "AAAAAA" });
            expect(result).toBe(doc);
        });
    });

    describe("resolveLongUrl — negative cache set before 404 throw", () => {
        it("calls setCacheNotFoundUrl before throwing when Mongo returns null", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockResolvedValue(false);
            getCachedUrl.mockResolvedValue(null);
            Url.findOne.mockResolvedValue(null);

            await expect(resolveLongUrl("AAAAAA")).rejects.toMatchObject({
                message: "UR not found",
                statusCode: 404,
            });
            expect(setCacheNotFoundUrl).toHaveBeenCalledWith("AAAAAA");
        });
    });

    describe("getUrlStats — negative cache set before 404 throw", () => {
        it("calls setCacheNotFoundUrl before throwing when Mongo returns null", async () => {
            isValidCode.mockReturnValue(true);
            getCachedNotFoundUrl.mockResolvedValue(false);
            Url.findOne.mockResolvedValue(null);

            await expect(getUrlStats("AAAAAA")).rejects.toMatchObject({
                message: "URL not found",
                statusCode: 404,
            });
            expect(setCacheNotFoundUrl).toHaveBeenCalledWith("AAAAAA");
        });
    });
});