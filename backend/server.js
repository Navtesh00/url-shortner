import dotenv from "dotenv";
import databaseConnection from "./src/config/db.js";
import app from "./src/app.js";

dotenv.config({ path: "./.env" });

let server;

const start = async () => {
    try {
        await databaseConnection();

        server = app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    if (server) {
        server.close(async () => {
            try {
                await mongoose.disconnect();
                console.log("Database connection closed");
            } catch (err) {
                console.error("Error closing database:", err);
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
