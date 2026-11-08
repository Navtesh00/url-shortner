import { AppError } from "../../src/utils/errors.js";

describe("AppError stack trace and catchability", () => {
    it("has a stack trace that is a string containing the error message", () => {
        const err = new AppError("something broke", 400);
        expect(typeof err.stack).toBe("string");
        expect(err.stack).toContain("AppError");
        expect(err.stack).toContain("something broke");
    });

    it("can be caught with try/catch", async () => {
        let caught = null;
        try {
            throw new AppError("catchable error", 400);
        } catch (err) {
            caught = err;
        }

        expect(caught).toBeInstanceOf(AppError);
        expect(caught).toBeInstanceOf(Error);
        expect(caught.message).toBe("catchable error");
        expect(caught.statusCode).toBe(400);
    });

    it("preserves the error when caught and rethrown", () => {
        let rethrown = null;
        try {
            try {
                throw new AppError("inner error", 500);
            } catch (err) {
                throw err;
            }
        } catch (err) {
            rethrown = err;
        }

        expect(rethrown).toBeInstanceOf(AppError);
        expect(rethrown.message).toBe("inner error");
        expect(rethrown.statusCode).toBe(500);
        expect(typeof rethrown.stack).toBe("string");
    });

    it("defaults statusCode to 500 when not provided", () => {
        const err = new AppError("no status code");
        expect(err.statusCode).toBe(500);
        expect(err.message).toBe("no status code");
    });

    it("sets name to AppError", () => {
        const err = new AppError("named error", 409);
        expect(err.name).toBe("AppError");
    });
});