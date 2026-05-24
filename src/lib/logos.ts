// src/lib/logos.ts
const TRUST_WALLET_BASE = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains";

// Map our internal chain keys to Trust Wallet chain folder names
const CHAIN_KEY_MAP: Record<string, string> = {
  base: "base",
  ethereum: "ethereum",
  arbitrum: "arbitrum",
  optimism: "optimism",
  polygon: "polygon",
  bsc: "smartchain",
  avalanche: "avalanchec",
  fantom: "fantom",
  gnosis: "gnosis",
  moonbeam: "moonbeam",
};

export function getTokenLogoUrl(chain: string, tokenAddress: string): string {
  const folder = CHAIN_KEY_MAP[chain] || "ethereum";
  const checksummed = tokenAddress.toLowerCase(); // Trust Wallet uses lowercase
  return `${TRUST_WALLET_BASE}/${folder}/assets/${checksummed}/logo.png`;
}