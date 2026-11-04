import { Router } from "express";
import { shortenUrl, redirectToLongUrl, fetchUrlStats } from "../controllers/url_controllers.js";

const router = Router();

// API endpoint to shorten a URL
router.post("/api/url_shortener", shortenUrl);

// API endpoint to get URL statistics
router.get("/api/:code/stats", fetchUrlStats);

// URL redirection
router.get("/:code", redirectToLongUrl);

export default router;
