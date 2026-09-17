import { Router } from "express";
import { shortenURL, urls, URLstatus } from "../controllers/URLs.controller.js";

const router = Router();

router.post("/api/shorten", shortenURL);
router.get('/:code', urls);
router.get("/api/shorten/:code/status",URLstatus)


export default router;