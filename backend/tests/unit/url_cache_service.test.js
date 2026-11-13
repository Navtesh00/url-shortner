jest.mock("../../src/config/redis.js", () => ({
    get: jest.fn(),
    set: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    rename: jest.fn(),
    del: jest.fn(),
    sscan: jest.fn(),
}));

import client from "../../src/config/redis.js";
import {
    getCachedUrl,
    setCache,
    bufferIncr,
    markDirty,
    getCachedNotFoundUrl,
    setCacheNotFoundUrl,
    bufferKey,
    dirtyKey,
    flushKey,
    cacheKey,
} from "../../src/services/url_cache_service.js";

describe("url_cache_service", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("getCachedUrl", () => {
        it("returns null on cache miss", async () => {
            client.get.mockResolvedValue(null);
            expect(await getCachedUrl("abc")).toBeNull();
            expect(client.get).toHaveBeenCalledWith(expect.stringContaining(":url:abc"));
        });

        it("returns the bare long URL string on hit", async () => {
            client.get.mockResolvedValue("https://example.com");
            expect(await getCachedUrl("abc")).toBe("https://example.com");
        });
    });

    describe("setCache", () => {
        it("stores a bare long URL string with EX TTL", async () => {
            client.set.mockResolvedValue("OK");
            await setCache("abc", "https://example.com");

            expect(client.set).toHaveBeenCalledWith(
                expect.stringContaining(":url:abc"),
                "https://example.com",
                "EX",
                expect.any(Number),
            );
        });
    });

    describe("bufferIncr", () => {
        it("increments per-code buffer without TTL", async () => {
            client.incr.mockResolvedValue(3);
            const result = await bufferIncr("abc");
            expect(result).toBe(3);
            expect(client.incr).toHaveBeenCalledWith(expect.stringContaining(":buffer:abc"));
        });
    });

    describe("markDirty", () => {
        it("adds code to dirty set without TTL", async () => {
            client.sadd.mockResolvedValue(1);
            await markDirty("abc");
            expect(client.sadd).toHaveBeenCalledWith(expect.stringContaining(":dirty"), "abc");
        });
    });

    describe("key builders", () => {
        it("builds cache key", () => {
            expect(cacheKey("abc")).toContain(":url:abc");
        });
        it("builds buffer key", () => {
            expect(bufferKey("abc")).toContain(":buffer:abc");
        });
        it("builds dirty key", () => {
            expect(dirtyKey).toContain(":dirty");
        });
        it("builds flush key", () => {
            expect(flushKey("abc", 1000)).toContain(":flush:abc:1000");
        });
    });

    describe("getCachedNotFoundUrl", () => {
        it("returns true when the negative-cache marker exists", async () => {
            client.exists.mockResolvedValue(1);
            expect(await getCachedNotFoundUrl("abc")).toBe(true);
            expect(client.exists).toHaveBeenCalledWith(expect.stringContaining(":notFound:abc"));
        });

        it("returns false when the marker does not exist", async () => {
            client.exists.mockResolvedValue(0);
            expect(await getCachedNotFoundUrl("abc")).toBe(false);
        });
    });

    describe("setCacheNotFoundUrl", () => {
        it("sets a short-lived not-found marker", async () => {
            client.set.mockResolvedValue("OK");
            await setCacheNotFoundUrl("abc");
            expect(client.set).toHaveBeenCalledWith(
                expect.stringContaining(":notFound:abc"),
                "1",
                "EX",
                expect.any(Number),
            );
        });
    });
});
