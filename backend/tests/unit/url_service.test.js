jest.mock("../../src/models/url_models.js", () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));
jest.mock("../../src/services/generate_code.js", () => jest.fn(() => "AAAAAA"));
jest.mock("../../src/services/url_cache_service.js", () => ({
    getCachedUrl: jest.fn(),
    getCachedNotFoundUrl: jest.fn(),
    setCache: jest.fn(),
    setCacheNotFoundUrl: jest.fn(),
    bufferIncr: jest.fn(),
    markDirty: jest.fn(),
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
    setCache,
    setCacheNotFoundUrl,
    bufferIncr,
    markDirty,
} from "../../src/services/url_cache_service.js";
import { isValidCode } from "../../src/utils/validators.js";
import { AppError } from "../../src/utils/errors.js";
import { createShortUrl, resolveLongUrl, getUrlStats } from "../../src/services/url_service.js";
import {
    VALID_CODE,
    makeUrlDoc,
    makeCachedUrlDoc,
    mockCodeValid,
    mockNotInNegativeCache,
    mockNegativeCacheHit,
    mockUrlCacheMiss,
    mockUrlCacheHit,
} from "./helpers/urlServiceTestUtils.js";

describe("createShortUrl", () => {
    beforeEach(() => jest.clearAllMocks());

    it("creates and returns a URL document", async () => {
        const doc = makeUrlDoc();
        Url.create.mockResolvedValue(doc);

        const result = await createShortUrl("https://example.com");

        expect(Url.create).toHaveBeenCalledWith({ longURL: "https://example.com", shortURL: VALID_CODE });
        expect(result).toBe(doc);
    });

    it("retries once on duplicate key 11000", async () => {
        const dupError = new Error("dup");
        dupError.code = 11000;
        const doc = { _id: "id1", shortURL: VALID_CODE };
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
        mockCodeValid(isValidCode, false);
        await expect(resolveLongUrl("bad")).rejects.toMatchObject({
            message: "Please provide a valid code",
            statusCode: 400,
        });
    });

    it("returns cached long URL on hit and buffers increment", async () => {
        mockCodeValid(isValidCode);
        mockNotInNegativeCache(getCachedNotFoundUrl);
        mockUrlCacheHit(getCachedUrl, "https://cached.com");

        const result = await resolveLongUrl(VALID_CODE);

        expect(result).toBe("https://cached.com");
        expect(Url.findOne).not.toHaveBeenCalled();
        expect(bufferIncr).toHaveBeenCalledWith(VALID_CODE);
        expect(markDirty).toHaveBeenCalledWith(VALID_CODE);
    });

    it("falls through to Mongo when cache misses", async () => {
        mockCodeValid(isValidCode);
        mockNotInNegativeCache(getCachedNotFoundUrl);
        mockUrlCacheMiss(getCachedUrl);
        const doc = makeUrlDoc();
        Url.findOne.mockResolvedValue(doc);

        const result = await resolveLongUrl(VALID_CODE);

        expect(Url.findOne).toHaveBeenCalledWith({ shortURL: VALID_CODE });
        expect(setCache).toHaveBeenCalledWith(VALID_CODE, doc.longURL);
        expect(bufferIncr).toHaveBeenCalledWith(VALID_CODE);
        expect(markDirty).toHaveBeenCalledWith(VALID_CODE);
        expect(result).toBe(doc.longURL);
    });

    it("calls setCacheNotFoundUrl before throwing when Mongo returns null", async () => {
        mockCodeValid(isValidCode);
        mockNotInNegativeCache(getCachedNotFoundUrl);
        mockUrlCacheMiss(getCachedUrl);
        Url.findOne.mockResolvedValue(null);

        await expect(resolveLongUrl(VALID_CODE)).rejects.toMatchObject({
            message: "UR not found",
            statusCode: 404,
        });
        expect(setCacheNotFoundUrl).toHaveBeenCalledWith(VALID_CODE);
    });

    it("returns 404 when negative cache already holds the code", async () => {
        mockCodeValid(isValidCode);
        mockNegativeCacheHit(getCachedNotFoundUrl);

        await expect(resolveLongUrl(VALID_CODE)).rejects.toMatchObject({
            message: "Not found URL",
            statusCode: 404,
        });
        expect(Url.findOne).not.toHaveBeenCalled();
    });

    it("propagates Redis errors from getCachedNotFoundUrl", async () => {
        mockCodeValid(isValidCode);
        getCachedNotFoundUrl.mockRejectedValue(new Error("redis connection failed"));

        await expect(resolveLongUrl(VALID_CODE)).rejects.toThrow("redis connection failed");
    });

    it("does not catch getCachedNotFoundUrl errors — known 500 risk", async () => {
        mockCodeValid(isValidCode);
        getCachedNotFoundUrl.mockRejectedValue(new Error("redis down"));

        await expect(resolveLongUrl(VALID_CODE)).rejects.toThrow("redis down");
    });

    it("falls back to MongoDB when getCachedUrl throws", async () => {
        mockCodeValid(isValidCode);
        mockNotInNegativeCache(getCachedNotFoundUrl);
        getCachedUrl.mockRejectedValue(new Error("redis get failed"));

        const doc = makeUrlDoc();
        Url.findOne.mockResolvedValue(doc);

        const result = await resolveLongUrl(VALID_CODE);

        expect(Url.findOne).toHaveBeenCalledWith({ shortURL: VALID_CODE });
        expect(result).toBe(doc.longURL);
    });

    it("returns the Mongo longURL even when setCache throws", async () => {
        mockCodeValid(isValidCode);
        mockNotInNegativeCache(getCachedNotFoundUrl);
        mockUrlCacheMiss(getCachedUrl);
        setCache.mockRejectedValue(new Error("redis set failed"));

        const doc = makeUrlDoc();
        Url.findOne.mockResolvedValue(doc);

        const result = await resolveLongUrl(VALID_CODE);

        expect(result).toBe(doc.longURL);
    });
});

describe("getUrlStats", () => {
    beforeEach(() => jest.clearAllMocks());

    it("rejects an invalid code", async () => {
        mockCodeValid(isValidCode, false);
        await expect(getUrlStats("bad")).rejects.toMatchObject({
            message: "Please provide a valid code",
            statusCode: 400,
        });
    });

    it("calls setCacheNotFoundUrl before throwing when Mongo returns null", async () => {
        mockCodeValid(isValidCode);
        mockNotInNegativeCache(getCachedNotFoundUrl);
        Url.findOne.mockResolvedValue(null);

        await expect(getUrlStats(VALID_CODE)).rejects.toMatchObject({
            message: "URL not found",
            statusCode: 404,
        });
        expect(setCacheNotFoundUrl).toHaveBeenCalledWith(VALID_CODE);
    });

    it("returns 404 when negative cache already holds the code", async () => {
        mockCodeValid(isValidCode);
        mockNegativeCacheHit(getCachedNotFoundUrl);

        await expect(getUrlStats(VALID_CODE)).rejects.toMatchObject({
            message: "URL not found",
            statusCode: 404,
        });
        expect(Url.findOne).not.toHaveBeenCalled();
    });

    it("reads from MongoDB", async () => {
        mockCodeValid(isValidCode);
        mockNotInNegativeCache(getCachedNotFoundUrl);
        const doc = makeUrlDoc({ totalVisits: 5 });
        Url.findOne.mockResolvedValue(doc);

        const result = await getUrlStats(VALID_CODE);

        expect(Url.findOne).toHaveBeenCalledWith({ shortURL: VALID_CODE });
        expect(result).toBe(doc);
    });

    it("propagates Redis errors from getCachedNotFoundUrl", async () => {
        mockCodeValid(isValidCode);
        getCachedNotFoundUrl.mockRejectedValue(new Error("redis stats failed"));

        await expect(getUrlStats(VALID_CODE)).rejects.toThrow("redis stats failed");
    });
});
