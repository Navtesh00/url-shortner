jest.mock("../../src/config/redis.js", () => ({
    get: jest.fn(),
    set: jest.fn(),
    exists: jest.fn(),
}));

import client from "../../src/config/redis.js";
import {
    getCachedUrl,
    getCachedNotFoundUrl,
    setCacheUrl,
    setCacheNotFoundUrl,
} from "../../src/services/url_cache_service.js";

describe("url_cache_service", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("getCachedUrl", () => {
        it("returns null on cache miss", async () => {
            client.get.mockResolvedValue(null);
            expect(await getCachedUrl("abc")).toBeNull();
            expect(client.get).toHaveBeenCalledWith(expect.stringContaining(":url:abc"));
        });

        it("parses and returns the JSON record on hit", async () => {
            client.get.mockResolvedValue(JSON.stringify({ _id: "1", longURL: "https://x.com" }));
            expect(await getCachedUrl("abc")).toEqual({ _id: "1", longURL: "https://x.com" });
        });

        it("returns null when the cached value is not valid JSON", async () => {
            client.get.mockResolvedValue("not-json");
            expect(await getCachedUrl("abc")).toBeNull();
        });
    });

    describe("setCacheUrl", () => {
        it("stores a JSON string record with the URL TTL", async () => {
            client.set.mockResolvedValue("OK");
            await setCacheUrl("abc", {
                _id: "1",
                longURL: "https://x.com",
                shortURL: "abc",
                totalVisits: 3,
                lastVisitedAt: null,
            });

            expect(client.set).toHaveBeenCalledWith(
                expect.stringContaining(":url:abc"),
                expect.stringContaining('"_id":"1"'),
                "EX",
                expect.any(Number),
            );
        });

        it("includes _id in the cached record", async () => {
            client.set.mockResolvedValue("OK");
            await setCacheUrl("abc", { _id: "1", longURL: "https://x.com", shortURL: "abc" });
            const payload = client.set.mock.calls[0][1];
            expect(JSON.parse(payload)).toHaveProperty("_id", "1");
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
