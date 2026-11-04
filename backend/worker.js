import dotenv from "dotenv";
import mongoose from "mongoose";
import databaseConnection from "./src/config/db.js";
import { visitWorker } from "./src/workers/index.js";

dotenv.config({ path: "./.env" });

await databaseConnection();

const shutdown = async () => {
  await visitWorker.close();
  await mongoose.disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
