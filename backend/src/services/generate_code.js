import { customAlphabet } from "nanoid";

const CODE_LENGTH = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateShortCode = customAlphabet(ALPHABET, CODE_LENGTH);
const BATCH_SIZE = 10;

export const generateShortCodeBatch = () => {
    const codes = new Set();
    while (codes.size < BATCH_SIZE) {
        codes.add(generateShortCode());
    }
    return Array.from(codes);
}

export default generateShortCode;
