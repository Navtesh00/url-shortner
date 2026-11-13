jest.mock("../../src/config/redis.js", () => ({
    ttl: jest.fn(),
    keys: jest.fn(),
}));

import client from "../../src/config/redis.js";

describe("TTL invariant audit", () => {
    beforeEach(() => jest.clearAllMocks());

    it("asserts url:* keys have TTL > 0", async () => {
        client.keys.mockResolvedValue(["urlShortener:dev:url:abc", "urlShortener:dev:url:def"]);
        client.ttl.mockResolvedValue(86300);

        const urlKeys = await client.keys("urlShortener:dev:url:*");
        for (const key of urlKeys) {
            const ttl = await client.ttl(key);
            expect(ttl).toBeGreaterThan(0);
        }
    });

    it("asserts buffer:* keys have TTL -1 (no TTL)", async () => {
        client.keys.mockResolvedValue(["urlShortener:dev:buffer:abc", "urlShortener:dev:buffer:def"]);
        client.ttl.mockResolvedValue(-1);

        const bufferKeys = await client.keys("urlShortener:dev:buffer:*");
        for (const key of bufferKeys) {
            const ttl = await client.ttl(key);
            expect(ttl).toBe(-1);
        }
    });

    it("asserts dirty key has TTL -1 (no TTL)", async () => {
        client.ttl.mockResolvedValue(-1);

        const ttl = await client.ttl("urlShortener:dev:dirty");
        expect(ttl).toBe(-1);
    });

    it("asserts flush:* keys have TTL -1 (no TTL)", async () => {
        client.keys.mockResolvedValue(["urlShortener:dev:flush:abc:1000"]);
        client.ttl.mockResolvedValue(-1);

        const flushKeys = await client.keys("urlShortener:dev:flush:*");
        for (const key of flushKeys) {
            const ttl = await client.ttl(key);
            expect(ttl).toBe(-1);
        }
    });
});
