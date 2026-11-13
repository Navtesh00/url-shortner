import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import urlRoutes from "./routes/url_routes.js";
import { errorHandler } from "./middleware/error_handler.js";

const app = express();
app.disable("x-powered-by");

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10kb" }));

const corsOptions = {
    origin: process.env.NODE_ENV === "production"
        ? (process.env.FRONTEND_ORIGIN || "https://frontend.example.com")
        : true,
    credentials: true,
};
app.use(cors(corsOptions));

app.use("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/", urlRoutes);

app.use(errorHandler);

export default app;
