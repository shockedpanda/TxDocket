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
 * Sends the API key as a header (x-cg-demo-api-key), which is the
 * recommended method for CoinGecko's Demo API.
 */
async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "x-cg-demo-api-key": API_KEY || "",
      },
    });
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

  const BATCH_SIZE = 30;               // CoinGecko limit per request
  const allPrices: Record<string, number> = {};

  for (let i = 0; i < tokenAddresses.length; i += BATCH_SIZE) {
    const batch = tokenAddresses.slice(i, i + BATCH_SIZE);
    const addresses = batch.join(",");
    const url = `${COINGECKO_BASE}/simple/token_price/${platform}?contract_addresses=${addresses}&vs_currencies=usd`;

    const data = await fetchJson(url);
    console.log("Current price batch", i, data);
    if (data) {
      for (const addr of batch) {
        const key = addr.toLowerCase();
        allPrices[key] = data[key]?.usd || 0;
      }
    } else {
      // Optional: log which batch failed, but don't break
      console.warn(`Batch starting at index ${i} failed for current prices`);
    }
  }

  return allPrices;
}

export async function fetchHistoricalPrice(
  tokenAddress: string,
  date: string,
  chain: string
): Promise<number | null> {
  const cacheKey = getCacheKey(tokenAddress, date);
  if (priceCache.has(cacheKey)) return priceCache.get(cacheKey)!;

  const platform = CHAIN_TO_PLATFORM[chain] || chain;
  // API key sent via header, not query string
  const url = `${COINGECKO_BASE}/simple/token_price/${platform}?contract_addresses=${tokenAddress}&vs_currencies=usd&date=${date}`;

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