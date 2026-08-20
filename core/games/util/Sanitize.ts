// Strip zero-width characters, newlines and tabs, then trim. Non-string input yields empty string.
export function str(s: unknown): string {
  return (typeof s === "string" ? s : "")
    .replace(/[\u200B-\u200D\uFEFF\n\t]/g, "")
    .trim();
}
