import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

export const RECOVERY_PHRASE_WORD_COUNT = 24;
const RECOVERY_PHRASE_STRENGTH_BITS = 256;

export function generateRecoveryPhrase(): string {
  return normalizeRecoveryPhrase(generateMnemonic(wordlist, RECOVERY_PHRASE_STRENGTH_BITS));
}

export function normalizeRecoveryPhrase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

export function isValidRecoveryPhrase(value: string): boolean {
  const normalized = normalizeRecoveryPhrase(value);
  const words = normalized ? normalized.split(" ") : [];

  return words.length === RECOVERY_PHRASE_WORD_COUNT && validateMnemonic(normalized, wordlist);
}

export function assertValidRecoveryPhrase(value: string): string {
  const normalized = normalizeRecoveryPhrase(value);

  if (!isValidRecoveryPhrase(normalized)) {
    throw new Error("Recovery phrase is invalid.");
  }

  return normalized;
}
