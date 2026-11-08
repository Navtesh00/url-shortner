import URL from "../../src/models/url_models.js";

describe("URL Mongoose schema", () => {
    it("longURL is required", () => {
        const path = URL.schema.paths.longURL;
        expect(path.isRequired).toBe(true);
        expect(path.options.type).toBe(String);
        expect(path.options.trim).toBe(true);
        expect(path.options.maxlength).toBe(2048);
    });

    it("shortURL is required, unique, indexed, and length-constrained", () => {
        const path = URL.schema.paths.shortURL;
        expect(path.isRequired).toBe(true);
        expect(path.options.unique).toBe(true);
        expect(path.options.index).toBe(true);
        expect(path.options.type).toBe(String);
        expect(path.options.minlength).toBe(6);
        expect(path.options.maxlength).toBe(10);
        expect(path.options.match).toBeInstanceOf(RegExp);
    });

    it("totalVisits defaults to 0 and has min 0", () => {
        const path = URL.schema.paths.totalVisits;
        expect(path.options.type).toBe(Number);
        expect(path.options.default).toBe(0);
        expect(path.options.min).toBe(0);
    });

    it("lastVisitedAt defaults to null and is a Date", () => {
        const path = URL.schema.paths.lastVisitedAt;
        expect(path.options.type).toBe(Date);
        expect(path.options.default).toBe(null);
    });

    it("timestamps are enabled", () => {
        expect(URL.schema.options.timestamps).toBe(true);
    });

    it("collection name is 'urls'", () => {
        expect(URL.collection.name).toBe("urls");
    });
});