import URL from "../models/URL.models.js";
import generateShortCode from "../services/generateCode.js";

export const shortenURL = async (req, res) => {
    try {
        const { longURL } = req.body;


        //URl Validation/Verification
        if (!longURL) {
            return res.status(400).json({ message: "Long URL is required" });
        }

        //creating short URL
        let shortURL = generateShortCode(longURL);

        while (await URL.findOne({ shortURL })) {
            shortURL = generateShortCode(longURL);
        }

        //Saving Short and Long URLs in DB and giving response
        const url = await URL.create({ longURL, shortURL });
        return res.status(201).json({ message: "URL shortened successfully", url });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const urls = async (req, res) => {
    try {
        const code = req.params.code;


        const url = await URL.findOneAndUpdate({ shortURL: code },
            {
                $inc: { totalVisits: 1 },
                $set: { lastVisitedAt: new Date() }
            }
        );
        if (!url) {
            return res.status(404).json({ message: "URL not found" });
        }
        return res.status(200).redirect(`${url.longURL}`);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const URLstatus = async (req, res) => {
    const code = req.params.code;

    const url = await URL.findOne({ shortURL: code });
    if (!url) {
        return res.status(404).json({ message: "URL not found" });
    }
    return res.status(200).json({ message: "URL found", url });
}   