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
import generateShortCode from "../../src/services/generate_code.js";
import {
    getCachedUrl,
    getCachedNotFoundUrl,
    setCacheUrl,
    setCacheNotFoundUrl,
} from "../../src/services/url_cache_service.js";
import { isValidCode } from "../../src/utils/validators.js";
import { AppError } from "../../src/utils/errors.js";
import { createShortUrl, resolveLongUrl, getUrlStats } from "../../src/services/url_service.js";

describe("createShortUrl", () => {
    beforeEach(() => jest.clearAllMocks());

    it("creates and returns a URL document", async () => {
        const doc = { _id: "id1", longURL: "https://example.com", shortURL: "AAAAAA", totalVisits: 0 };
        Url.create.mockResolvedValue(doc);

        const result = await createShortUrl("https://example.com");

        expect(Url.create).toHaveBeenCalledWith({ longURL: "https://example.com", shortURL: "AAAAAA" });
        expect(result).toBe(doc);
    });

    it("retries once on duplicate key 11000", async () => {
        const dupError = new Error("dup");
        dupError.code = 11000;
        const doc = { _id: "id1", shortURL: "AAAAAA" };
        Url.create.mockRejectedValueOnce(dupError).mockResolvedValue(doc);

        const result = await createShortUrl("https://example.com");

        expect(Url.create).toHaveBeenCalledTimes(2);
        expect(result).toBe(doc);
    });

    it("throws AppError after 5 attempts on persistent 11000", async () => {
        const dupError = new Error("dup");
        dupError.code = 11000;
        Url.create.mockRejectedValue(dupError);

        await expect(createShortUrl("https://example.com")).rejects.toThrow(AppError);
        expect(Url.create).toHaveBeenCalledTimes(5);
    });

    it("rethrows non-11000 errors immediately without retrying", async () => {
        const err = new Error("db down");
        Url.create.mockRejectedValue(err);

        await expect(createShortUrl("https://example.com")).rejects.toBe(err);
        expect(Url.create).toHaveBeenCalledTimes(1);
    });
});

describe("resolveLongUrl", () => {
    beforeEach(() => jest.clearAllMocks());

    it("rejects an invalid code", async () => {
        isValidCode.mockReturnValue(false);
        await expect(resolveLongUrl("bad")).rejects.toMatchObject({
            message: "Please provide a valid code",
            statusCode: 400,
        });
    });

    it("returns the cached record when it has an _id", async () => {
        isValidCode.mockReturnValue(true);
        getCachedNotFoundUrl.mockResolvedValue(false);
        getCachedUrl.mockResolvedValue({ _id: "id1", longURL: "https://example.com" });

        const result = await resolveLongUrl("AAAAAA");

        expect(result).toEqual({ _id: "id1", longURL: "https://example.com" });
        expect(Url.findOne).not.toHaveBeenCalled();
    });

    it("falls back to MongoDB on cache miss and caches the record", async () => {
        isValidCode.mockReturnValue(true);
        getCachedNotFoundUrl.mockResolvedValue(false);
        getCachedUrl.mockResolvedValue(null);
        const doc = { _id: "id1", longURL: "https://example.com", shortURL: "AAAAAA", totalVisits: 0 };
        Url.findOne.mockResolvedValue(doc);

        const result = await resolveLongUrl("AAAAAA");

        expect(Url.findOne).toHaveBeenCalledWith({ shortURL: "AAAAAA" });
        expect(setCacheUrl).toHaveBeenCalledWith("AAAAAA", doc);
        expect(result).toBe(doc);
    });

    it("throws 404 and caches negative when the URL is missing", async () => {
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

    it("returns 404 when negative cache already holds the code", async () => {
        isValidCode.mockReturnValue(true);
        getCachedNotFoundUrl.mockResolvedValue(true);

        await expect(resolveLongUrl("AAAAAA")).rejects.toMatchObject({
            message: "Not found URL",
            statusCode: 404,
        });
        expect(Url.findOne).not.toHaveBeenCalled();
    });
});

describe("getUrlStats", () => {
    beforeEach(() => jest.clearAllMocks());

    it("rejects an invalid code", async () => {
        isValidCode.mockReturnValue(false);
        await expect(getUrlStats("bad")).rejects.toMatchObject({
            message: "Please provide a valid code",
            statusCode: 400,
        });
    });

    it("throws 404 and caches negative when the URL is missing", async () => {
        isValidCode.mockReturnValue(true);
        getCachedNotFoundUrl.mockResolvedValue(false);
        Url.findOne.mockResolvedValue(null);

        await expect(getUrlStats("AAAAAA")).rejects.toMatchObject({
            message: "URL not found",
            statusCode: 404,
        });
        expect(setCacheNotFoundUrl).toHaveBeenCalledWith("AAAAAA");
    });

    it("returns 404 when negative cache already holds the code", async () => {
        isValidCode.mockReturnValue(true);
        getCachedNotFoundUrl.mockResolvedValue(true);

        await expect(getUrlStats("AAAAAA")).rejects.toMatchObject({
            message: "URL not found",
            statusCode: 404,
        });
        expect(Url.findOne).not.toHaveBeenCalled();
    });

    it("reads from MongoDB and caches the record on success", async () => {
        isValidCode.mockReturnValue(true);
        getCachedNotFoundUrl.mockResolvedValue(false);
        const doc = { _id: "id1", longURL: "https://example.com", shortURL: "AAAAAA", totalVisits: 5 };
        Url.findOne.mockResolvedValue(doc);

        const result = await getUrlStats("AAAAAA");

        expect(Url.findOne).toHaveBeenCalledWith({ shortURL: "AAAAAA" });
        expect(setCacheUrl).toHaveBeenCalledWith("AAAAAA", doc);
        expect(result).toBe(doc);
    });
});
