// src/lib/constants.ts

export const BLOCKSCOUT_BASE_URL = "https://base.blockscout.com/api/v2";
export const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".toLowerCase();
export const DONATION_ADDRESS = "0x745f4388EB7658a1367B66FEB11D4e342b7e3652";

// Etherscan V2 base
export const ETHERSCAN_API_BASE = "https://api.etherscan.io/v2/api";

// Chain ID mapping for EVM chains (Etherscan V2)
export const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  arbitrum: 42161,
  optimism: 10,
};

// Stablecoins (unchanged)
export const STABLECOINS: Record<string, string> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC",
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": "USDT",
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": "DAI",
};