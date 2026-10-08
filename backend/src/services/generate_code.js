import { customAlphabet } from "nanoid";

const CODE_LENGTH = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateShortCode = customAlphabet(ALPHABET, CODE_LENGTH);

export default generateShortCode;