const isProduction = process.env.NODE_ENV === "production";

export const logger = {
    info: (message, ...args) => {
        if (isProduction) {
            console.info(JSON.stringify({ level: "info", message, timestamp: new Date().toISOString(), ...args }));
        } else {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    error: (message, error, ...args) => {
        if (isProduction) {
            console.error(JSON.stringify({
                level: "error",
                message,
                error: error?.message ?? String(error),
                stack: error?.stack,
                timestamp: new Date().toISOString(),
                ...args,
            }));
        } else {
            console.error(`[ERROR] ${message}`, error ?? "", ...args);
        }
    },
    warn: (message, ...args) => {
        if (isProduction) {
            console.warn(JSON.stringify({ level: "warn", message, timestamp: new Date().toISOString(), ...args }));
        } else {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },
};
