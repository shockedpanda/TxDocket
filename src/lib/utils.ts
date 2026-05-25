// src/lib/utils.ts

const SCAM_KEYWORDS = [
  "visit to claim",
  "airdrop",
  "claim",
  "giveaway",
  "reward",
  "free",
  "t.me/",
  "pool",
  "bonus",
  "earn",
  "presale",
  "token sale",
  "official site",
];

/**
 * Returns true if the token name is likely a scam/spam token.
 * Checks:
 * 1. Common scam keywords
 * 2. Contains suspicious Unicode characters (diacritics, non-Latin)
 */
export function isScamToken(tokenName: string): boolean {
  const lower = tokenName.toLowerCase();

  // 1. Keyword check
  if (SCAM_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return true;
  }

  // 2. Suspicious Unicode check
  // Detect any character that is not a standard ASCII letter/number, space, dot, or hyphen.
  // This catches ETH with a dot under (U+0323), etc.
  const suspiciousChars = /[^\x00-\x7F]/; // matches any non-ASCII character
  if (suspiciousChars.test(tokenName)) {
    return true;
  }

  return false;
}