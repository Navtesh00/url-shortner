import Url from "../models/url_models.js";
import generateShortCode from "./generate_code.js";
import { getCachedUrl, cacheUrl } from "./url_cache_service.js";
import { isValidCode } from "../utils/validators.js";
import { AppError } from "../utils/errors.js";

const generateUniqueShortCode = async () => {
    let shortURL = generateShortCode();

    while (await Url.findOne({ shortURL })) {
        shortURL = generateShortCode();
    }

    return shortURL;
}

export const createShortUrl = async (longURL) => {
    const shortURL = await generateUniqueShortCode();

    return Url.create({ longURL, shortURL });
}

export const resolveLongUrl = async (code) => {
    if (!isValidCode(code)) {
        throw new AppError("Please provide a valid code", 400);
    }

    const cachedLongURL = await getCachedUrl(code);
    if (cachedLongURL) return cachedLongURL;

    const url = await Url.findOneAndUpdate(
        { shortURL: code },
        { $inc: { totalVisits: 1 }, $set: { lastVisitedAt: new Date() } }
    );

    if (!url) {
        throw new AppError("URL not found", 404);
    }

    await cacheUrl(code, url);

    return url.longURL;
}

export const getUrlStats = async (code) => {
    const url = await Url.findOne({ shortURL: code });

    if (!url) {
        throw new AppError("URL not found", 404);
    }

    return url;
}
