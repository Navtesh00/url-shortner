import { visitJobsQueue } from "../config/bullMQ.js";
import { UPDATE_VISIT_COUNT } from "./job_names.js";

export const enqueueVisitJob = (jobData) => {
  return visitJobsQueue.add(UPDATE_VISIT_COUNT, jobData);
};
