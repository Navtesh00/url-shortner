import { AppError } from "../utils/errors.js";

export const errorHandler = (err, req, res, next) => {
    console.log(err);

    //Error thrown by the application layer
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    //Duplicate key error handling
    if (err.code === 11000) {
        return res.status(409).json({ message: "Internal server error , please retry" });
    }

    //Cast error handling
    if (err.name === "CastError") {
        return res.status(400).json({ message: "Invalid ID" });
    }

    //Validation error handling
    if (err.name === "ValidationError") {
        return res.status(400).json({ message: err.message });
    }

    //Internal server error handling
    return res.status(500).json({
        message: err.message ?? "Internal server error",
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
}
