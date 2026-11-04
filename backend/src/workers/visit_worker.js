import { UnrecoverableError } from "bullmq";
import URL from "../models/url_models.js";

export const processVisitJob = async (job) => {
  const { urlId, shortCode, visitedAt } = job.data;

  const url = await URL.findOneAndUpdate(
    { _id: urlId },
    { $inc: { totalVisits: 1 }, $set: { lastVisitedAt: visitedAt } },
    { new: true }
  );

  if (!url) {
    throw new UnrecoverableError(`URL not found: ${urlId}`);
  }

  return url;
};
