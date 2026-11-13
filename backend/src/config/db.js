import mongoose from "mongoose";
import { logger } from "./utils/logger.js";

const databaseConnection = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}`);
        logger.info("Database connected successfully");
    } catch (error) {
        logger.error("Error connecting to database", error);
        process.exit(1);
    }
}

export default databaseConnection;
