import { isValidUrl, isValidCode } from "../../src/utils/validators.js";

describe("isValidUrl", () => {
    it("accepts https URLs", () => {
        expect(isValidUrl("https://example.com")).toBe(true);
        expect(isValidUrl("https://example.com/path?q=1")).toBe(true);
    });

    it("accepts http URLs", () => {
        expect(isValidUrl("http://example.com")).toBe(true);
    });

    it("rejects non-http(s) schemes", () => {
        expect(isValidUrl("ftp://example.com")).toBe(false);
        expect(isValidUrl("mailto:test@example.com")).toBe(false);
        expect(isValidUrl("javascript:alert(1)")).toBe(false);
    });

    it("rejects empty and non-string input", () => {
        expect(isValidUrl("")).toBe(false);
        expect(isValidUrl(null)).toBe(false);
        expect(isValidUrl(undefined)).toBe(false);
        expect(isValidUrl(123)).toBe(false);
    });

    it("rejects malformed URLs", () => {
        expect(isValidUrl("not-a-url")).toBe(false);
        expect(isValidUrl("htp://example.com")).toBe(false);
    });
});

describe("isValidCode", () => {
    it("accepts exactly 6 alphanumeric characters", () => {
        expect(isValidCode("aB3xK9")).toBe(true);
        expect(isValidCode("ABCDEF")).toBe(true);
        expect(isValidCode("123456")).toBe(true);
        expect(isValidCode("abcdef")).toBe(true);
    });

    it("rejects wrong length", () => {
        expect(isValidCode("abc")).toBe(false);
        expect(isValidCode("abcdefg")).toBe(false);
        expect(isValidCode("")).toBe(false);
    });

    it("rejects non-alphanumeric characters", () => {
        expect(isValidCode("aB3x-K")).toBe(false);
        expect(isValidCode("a_b3x9")).toBe(false);
        expect(isValidCode("aB3x K9")).toBe(false);
    });

    it("is case-sensitive (accepts both cases)", () => {
        expect(isValidCode("AbCdEf")).toBe(true);
        expect(isValidCode("abcdef")).toBe(true);
        expect(isValidCode("ABCDEF")).toBe(true);
    });

    it("rejects non-string input", () => {
        expect(isValidCode(null)).toBe(false);
        expect(isValidCode(undefined)).toBe(false);
        expect(isValidCode(123456)).toBe(false);
    });
});
