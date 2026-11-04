import { createShortUrl, resolveLongUrl, getUrlStats } from "../services/url_service.js";
import { isValidUrl } from "../utils/validators.js";
import { AppError } from "../utils/errors.js";
import { enqueueVisitJob } from "../jobs/visit_job_producer.js";

export const shortenUrl = async (req, res) => {

    const { longURL } = req.body;

    if (!isValidUrl(longURL)) {
        throw new AppError("Please provide a valid longURL", 400);
    }

    const url = await createShortUrl(longURL);

    res.status(201).json({ message: "URL shortened successfully", url });
}

export const redirectToLongUrl = async (req, res) => {
    const url = await resolveLongUrl(req.params.code);

    enqueueVisitJob({ urlId: url._id, shortCode: req.params.code, visitedAt: new Date() }).catch(() => {});

    res.redirect(302, url.longURL);
}

export const fetchUrlStats = async (req, res) => {
    const url = await getUrlStats(req.params.code);

    res.status(200).json({ message: "URL found", url });
}
