import { errorHandler } from "../../src/middleware/error_handler.js";
import { AppError } from "../../src/utils/errors.js";

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe("errorHandler middleware", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNext.mockClear();
    });

    it("handles AppError with its statusCode and message", () => {
        const err = new AppError("Not found", 404);
        const req = {};
        const res = mockRes();

        errorHandler(err, req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Not found" });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it("defaults AppError statusCode to 500", () => {
        const err = new AppError("boom");
        const req = {};
        const res = mockRes();

        errorHandler(err, req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "boom" });
    });

    it("handles Mongo duplicate key (11000) as 409", () => {
        const err = new Error("duplicate");
        err.code = 11000;
        const req = {};
        const res = mockRes();

        errorHandler(err, req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error , please retry" });
    });

    it("handles CastError as 400", () => {
        const err = new Error("cast failed");
        err.name = "CastError";
        const req = {};
        const res = mockRes();

        errorHandler(err, req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid ID" });
    });

    it("handles ValidationError as 400", () => {
        const err = new Error("validation failed");
        err.name = "ValidationError";
        err.message = "Path `email` is required.";
        const req = {};
        const res = mockRes();

        errorHandler(err, req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Path `email` is required." });
    });

    it("handles malformed JSON body (SyntaxError with status 400) as 400", () => {
        const err = new SyntaxError("Unexpected token");
        err.status = 400;
        err.body = true;
        const req = {};
        const res = mockRes();

        errorHandler(err, req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid JSON body" });
    });

    it("returns 500 for unhandled errors", () => {
        const err = new Error("something unexpected");
        const req = {};
        const res = mockRes();

        errorHandler(err, req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "something unexpected",
            stack: expect.any(String),
        });
    });

    it("omits stack in production", () => {
        const origEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        try {
            const err = new Error("prod error");
            const req = {};
            const res = mockRes();

            errorHandler(err, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "prod error",
                stack: null,
            });
        } finally {
            process.env.NODE_ENV = origEnv;
        }
    });
});