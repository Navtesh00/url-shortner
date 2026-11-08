export const VALID_CODE = "AAAAAA";

export const makeUrlDoc = (overrides = {}) => ({
    _id: "id1",
    longURL: "https://example.com",
    shortURL: VALID_CODE,
    totalVisits: 0,
    ...overrides,
});

export const makeCachedUrlDoc = (overrides = {}) => ({
    _id: "cached-id",
    longURL: "https://cached.com",
    shortURL: VALID_CODE,
    ...overrides,
});

export const mockCodeValid = (isValidCode, value = true) => {
    isValidCode.mockReturnValue(value);
};

export const mockNotInNegativeCache = (getCachedNotFoundUrl) => {
    getCachedNotFoundUrl.mockResolvedValue(false);
};

export const mockNegativeCacheHit = (getCachedNotFoundUrl) => {
    getCachedNotFoundUrl.mockResolvedValue(true);
};

export const mockUrlCacheMiss = (getCachedUrl) => {
    getCachedUrl.mockResolvedValue(null);
};

export const mockUrlCacheHit = (getCachedUrl, record) => {
    getCachedUrl.mockResolvedValue(record);
};
