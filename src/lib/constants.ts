// src/lib/constants.ts

// Blockscout API base URL for Base mainnet
export const BLOCKSCOUT_BASE_URL = "https://base.blockscout.com/api/v2";

// Some known token addresses for Base (optional, but helpful)
export const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".toLowerCase();

// Known stablecoin contract addresses on Base (lowercase)
export const STABLECOINS: Record<string, string> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC",
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": "USDT",  // Tether USDt
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": "DAI",   // Dai Stablecoin
  // Add more stablecoins as needed
};

// Donation wallet address (your Base address for tips)
export const DONATION_ADDRESS = "0x745f4388EB7658a1367B66FEB11D4e342b7e3652";