import path from "node:path";

const STORED_FILE_SUFFIX = /-\d{13,}-\d+$/;

function replacementCharacterCount(value: string): number {
  return [...value].filter((character) => character === "\uFFFD").length;
}

/**
 * Browsers send UTF-8 filenames, while multipart parsers can expose header bytes
 * as Latin-1. Decode only when the conversion is lossless and produces Hangul.
 */
export function normalizeMultipartFilename(filename: string): string {
  const decoded = Buffer.from(filename, "latin1").toString("utf8");
  if (decoded === filename || decoded.includes("\uFFFD")) return filename;

  const originalHasHangul = /\p{Script=Hangul}/u.test(filename);
  const decodedHasHangul = /\p{Script=Hangul}/u.test(decoded);
  return !originalHasHangul && decodedHasHangul ? decoded : filename;
}

function looksIrrecoverablyCorrupted(filename: string): boolean {
  if (!/[^\x00-\x7F]/.test(filename)) return false;
  if (/\p{Script=Hangul}/u.test(filename)) return false;
  const decoded = Buffer.from(filename, "latin1").toString("utf8");
  return replacementCharacterCount(decoded) >= 2;
}

/**
 * Legacy uploads did not preserve the original name. Remove the server suffix;
 * if UTF-8 bytes were already discarded, show a readable fallback instead of
 * mojibake because the exact original name can no longer be reconstructed.
 */
export function displayNameFromStoredFilename(storedFilename: string): string {
  const extension = path.extname(storedFilename);
  const basename = path
    .basename(storedFilename, extension)
    .replace(STORED_FILE_SUFFIX, "")
    .trim();

  if (!looksIrrecoverablyCorrupted(basename)) {
    return `${basename || "업로드 파일"}${extension}`;
  }

  const order = basename.match(/^\s*(\d+)[.)]?/)?.[1];
  return `${order ? `${order}. ` : ""}업로드 파일${extension}`;
}
