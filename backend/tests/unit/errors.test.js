import { AppError } from "../../src/utils/errors.js";

describe("AppError", () => {
    it("sets message and statusCode", () => {
        const err = new AppError("Not found", 404);
        expect(err.message).toBe("Not found");
        expect(err.statusCode).toBe(404);
    });

    it("defaults statusCode to 500", () => {
        const err = new AppError("boom");
        expect(err.statusCode).toBe(500);
    });

    it("is an instance of Error", () => {
        const err = new AppError("x", 400);
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe("AppError");
    });

    it("constructor order is (message, statusCode)", () => {
        const err = new AppError("custom message", 409);
        expect(err.message).toBe("custom message");
        expect(err.statusCode).toBe(409);
    });
});
