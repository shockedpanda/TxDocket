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

export function isScamToken(tokenName: string): boolean {
  const lower = tokenName.toLowerCase();
  return SCAM_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
}