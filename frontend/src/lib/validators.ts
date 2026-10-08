/** Mirrors the rules in backend/src/utils/validators.js */
const CODE_PATTERN = /^[a-zA-Z0-9]{6,10}$/;

export function isValidHttpUrl(value: string): boolean {
  if (value.trim() === "") return false;

  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidCode(code: unknown): code is string {
  return typeof code === "string" && CODE_PATTERN.test(code);
}