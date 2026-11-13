import { Router } from "express";
import rateLimit from "express-rate-limit";
import { shortenUrl, redirectToLongUrl, fetchUrlStats } from "../controllers/url_controllers.js";

const router = Router();

// Health endpoint
router.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

// Rate limiter for URL shortening endpoint
const shortenLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

// API endpoint to shorten a URL
router.post("/api/url_shortener", shortenLimiter, shortenUrl);

// API endpoint to get URL statistics
router.get("/api/:code/stats", fetchUrlStats);

// URL redirection
router.get("/:code", redirectToLongUrl);

export default router;
