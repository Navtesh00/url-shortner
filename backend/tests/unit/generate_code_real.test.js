import generateShortCode from "../../src/services/generate_code.js";

describe("generateShortCode (real nanoid, unmocked)", () => {
    it("returns a 6-character string", () => {
        const code = generateShortCode();
        expect(typeof code).toBe("string");
        expect(code.length).toBe(6);
    });

    it("uses only alphanumeric characters", () => {
        for (let i = 0; i < 100; i++) {
            expect(/^[A-Za-z0-9]{6}$/.test(generateShortCode())).toBe(true);
        }
    });

    it("produces varied codes (not constant)", () => {
        const codes = new Set();
        for (let i = 0; i < 100; i++) {
            codes.add(generateShortCode());
        }
        expect(codes.size).toBeGreaterThan(1);
    });

    it("does not produce sequential/predictable codes", () => {
        const codes = [
            generateShortCode(),
            generateShortCode(),
            generateShortCode(),
            generateShortCode(),
            generateShortCode(),
        ];
        expect(new Set(codes).size).toBe(5);
    });
});