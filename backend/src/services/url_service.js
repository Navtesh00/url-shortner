import Url from "../models/url_models.js";
import generateShortCode from "./generate_code.js";
import { getCachedUrl, getCachedNotFoundUrl, setCacheUrl, setCacheNotFoundUrl, touchVisits } from "./url_cache_service.js";
import { isValidCode } from "../utils/validators.js";
import { AppError } from "../utils/errors.js";

const updateCacheTimer = setInterval(async () => {

}, 60 * 30 * 1000);

const generateUniqueShortCode = async () => {
    let shortURL = generateShortCode();

    while (await Url.findOne({ shortURL })) {
        shortURL = generateShortCode();
    }

    return shortURL;
}

export const createShortUrl = async (longURL) => {
    const shortURL = await generateUniqueShortCode();

    for (let i = 0; i < 5; i++) {
        try {
            return await Url.create({ longURL, shortURL });
        } catch (error) {
            if (error.code !== 11000) {
                throw error;
            }
        }
    }

    throw new AppError("Failed to create short URL", 500);
}

export const resolveLongUrl = async (code) => {
    if (!isValidCode(code)) {
        throw new AppError("Please provide a valid code", 400);
    }

    if (await getCachedNotFoundUrl(code)) {
        throw new AppError("Not found URL", 404);
    }

    let cached;
    try {
        cached = await getCachedUrl(code);
        if (cached) {
            // Count the visit even when the redirect is served from cache.
            touchVisits(code);
            return cached.longURL;
        }
    } catch {
        console.log("Failed to get cached URL");
    }

    const url = await Url.findOneAndUpdate(
        { shortURL: code },
        { $inc: { totalVisits: 1 }, $set: { lastVisitedAt: new Date() } },
        { new: true }
    );

    if (!url) {
        await setCacheNotFoundUrl(code);
        throw new AppError("UR not found", 404);
    }

    try {
        await setCacheUrl(code, url);
    } catch {
        console.log("Failed to set cached URL");
    }

    return url.longURL;
}

export const getUrlStats = async (code) => {

    if (!isValidCode(code)) {
        throw new AppError("Please provide a valid code", 400);
    }

    if (await getCachedNotFoundUrl(code)) {
        throw new AppError("URL not found", 404);
    }

    // Always read live counts from the DB so the stats page is accurate,
    // even when a redirect served the visit from cache.
    const url = await Url.findOne({ shortURL: code });

    if (!url) {
        await setCacheNotFoundUrl(code);
        throw new AppError("URL not found", 404);
    }

    try {
        await setCacheUrl(code, url);
    } catch {
        console.log("Failed to set cached URL");
    }

    return url;
}
