// src/lib/prices.ts
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY;

const CHAIN_TO_PLATFORM: Record<string, string> = {
  ethereum: "ethereum",
  base: "base",
  arbitrum: "arbitrum-one",
  optimism: "optimistic-ethereum",
  polygon: "polygon-pos",
  bsc: "binance-smart-chain",
  avalanche: "avalanche",
  fantom: "fantom",
  gnosis: "gnosis",
  moonbeam: "moonbeam",
};

const priceCache: Map<string, number> = new Map();
function getCacheKey(addr: string, date: string) {
  return `${addr.toLowerCase()}_${date}`;
}

/**
 * Helper: fetch JSON from a URL and handle errors gracefully.
 * Returns the parsed JSON or null if the call failed.
 */
async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("CoinGecko HTTP error:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.warn("CoinGecko returned non-JSON:", contentType, await res.text().catch(() => ""));
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("CoinGecko fetch failed:", err);
    return null;
  }
}

export async function fetchCurrentPrices(
  tokenAddresses: string[],
  chain: string
): Promise<Record<string, number>> {
  const platform = CHAIN_TO_PLATFORM[chain] || chain;
  if (!tokenAddresses.length) return {};

  const addresses = tokenAddresses.join(",");
  const url = `${COINGECKO_BASE}/simple/token_price/${platform}?contract_addresses=${addresses}&vs_currencies=usd&x_cg_demo_api_key=${API_KEY}`;

  const data = await fetchJson(url);
  if (!data) return {};
  const prices: Record<string, number> = {};
  for (const addr of tokenAddresses) {
    const key = addr.toLowerCase();
    prices[key] = data[key]?.usd || 0;
  }
  return prices;
}

export async function fetchHistoricalPrice(
  tokenAddress: string,
  date: string,
  chain: string
): Promise<number | null> {
  const cacheKey = getCacheKey(tokenAddress, date);
  if (priceCache.has(cacheKey)) return priceCache.get(cacheKey)!;

  const platform = CHAIN_TO_PLATFORM[chain] || chain;
  const url = `${COINGECKO_BASE}/simple/token_price/${platform}?contract_addresses=${tokenAddress}&vs_currencies=usd&date=${date}&x_cg_demo_api_key=${API_KEY}`;

  const data = await fetchJson(url);
  if (data) {
    const price = data[tokenAddress.toLowerCase()]?.usd;
    if (price !== undefined) {
      priceCache.set(cacheKey, price);
      return price;
    }
  }
  return null;
}

export async function getHistoricalPricesForTransfers(
  transfers: any[],
  chain: string
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  const unique = new Map<string, { address: string; date: string }>();
  transfers.forEach((tx) => {
    if (tx.tokenAddress && tx.date) {
      const key = getCacheKey(tx.tokenAddress, tx.date);
      if (!unique.has(key)) {
        unique.set(key, { address: tx.tokenAddress, date: tx.date });
      }
    }
  });

  const promises = Array.from(unique.values()).map(async ({ address, date }) => {
    const price = await fetchHistoricalPrice(address, date, chain);
    if (price !== null) {
      prices[getCacheKey(address, date)] = price;
    }
  });
  await Promise.all(promises);
  return prices;
}