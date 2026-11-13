const CODE_PATTERN = /^[a-zA-Z0-9]{6}$/;
const ALLOWED_PROTOCOLS = ["http:", "https:"];

// Private / reserved IP ranges per RFC 1918, RFC 5737, RFC 6598, RFC 4862, RFC 4291
const PRIVATE_IP_PATTERNS = [
    /^127\./,                                   // loopback
    /^10\./,                                    // RFC 1918 class A
    /^172\.(1[6-9]|2[0-9]|3[01])\./,            // RFC 1918 class B
    /^192\.168\./,                              // RFC 1918 class C
    /^169\.254\./,                              // link-local
    /^::1$/,                                    // IPv6 loopback
    /^fc00:/,                                   // IPv6 unique local
    /^fe80:/,                                   // IPv6 link-local
    /^100\.(6[4-9]|7[1-9]|[81][0-9]|9[0-9])\./, // RFC 6598 CGN
    /^224\./,                                   // multicast
    /^240\./,                                   // reserved
    /^0\.0\.0\.0$/,                             // unspecified
];

export const isValidUrl = (url) => {
    if (typeof url !== "string" || url.trim() === "") return false;

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return false;
    }

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        return false;
    }

    const host = parsed.hostname;

    if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(host))) {
        return false;
    }

    return true;
}

export const isValidCode = (code) => typeof code === "string" && CODE_PATTERN.test(code);
