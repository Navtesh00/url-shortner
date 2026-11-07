jest.mock("nanoid", () => ({
    customAlphabet: jest.fn((alphabet, length) => {
        let counter = 0;
        return () => {
            counter += 1;
            return counter.toString().padStart(length, "0");
        };
    }),
}));

import generateShortCode from "../../src/services/generate_code.js";

describe("generateShortCode", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns a 6-character string", () => {
        const code = generateShortCode();
        expect(typeof code).toBe("string");
        expect(code.length).toBe(6);
    });

    it("uses only alphanumeric characters", () => {
        for (let i = 0; i < 50; i++) {
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
});
