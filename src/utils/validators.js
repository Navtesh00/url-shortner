const CODE_PATTERN = /^[a-zA-Z0-9]{6}$/;
const ALLOWED_PROTOCOLS = ["http:", "https:"];

export const isValidUrl = (url) => {
    if (typeof url !== "string" || url.trim() === "") return false;

    try {
        return ALLOWED_PROTOCOLS.includes(new URL(url).protocol);
    } catch {
        return false;
    }
}

export const isValidCode = (code) => typeof code === "string" && CODE_PATTERN.test(code);
