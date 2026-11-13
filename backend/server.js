import dotenv from "dotenv";
import databaseConnection from "./src/config/db.js";
import app from "./src/app.js";
import { logger } from "./src/utils/logger.js";

dotenv.config({ path: "./.env" });

let server;

const start = async () => {
    try {
        await databaseConnection();

        server = app.listen(process.env.PORT, () => {
            logger.info(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        logger.error("Failed to start server", error);
        process.exit(1);
    }
};

const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    if (server) {
        server.close(async () => {
            try {
                await mongoose.disconnect();
                logger.info("Database connection closed");
            } catch (err) {
                logger.error("Error closing database", err);
            } finally {
                process.exit(0);
            }
        });
    } else {
        process.exit(0);
    }
};

import mongoose from "mongoose";

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
