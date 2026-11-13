import Url from "../models/url_models.js";
import generateShortCode from "./generate_code.js";
import { isValidCode } from "../utils/validators.js";
import { AppError } from "../utils/errors.js";
import {
    getCachedUrl,
    setCache,
    getCachedNotFoundUrl,
    setCacheNotFoundUrl,
    bufferIncr,
    markDirty,
} from "./url_cache_service.js";

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

    let longURL;
    try {
        longURL = await getCachedUrl(code);
    } catch {
        console.log("Failed to get cached URL");
    }

    if (longURL) {
        await bufferIncr(code);
        await markDirty(code);
        return longURL;
    }

    const url = await Url.findOne({ shortURL: code });

    if (!url) {
        await setCacheNotFoundUrl(code);
        throw new AppError("UR not found", 404);
    }

    try {
        await setCache(code, url.longURL);
    } catch {
        console.log("Failed to set cached URL");
    }

    await bufferIncr(code);
    await markDirty(code);

    return url.longURL;
}

export const getUrlStats = async (code) => {

    if (!isValidCode(code)) {
        throw new AppError("Please provide a valid code", 400);
    }

    if (await getCachedNotFoundUrl(code)) {
        throw new AppError("URL not found", 404);
    }

    const url = await Url.findOne({ shortURL: code });

    if (!url) {
        await setCacheNotFoundUrl(code);
        throw new AppError("URL not found", 404);
    }

    return url;
}
