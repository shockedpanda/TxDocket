// src/app/api/transfers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BLOCKSCOUT_BASE_URL, CHAIN_IDS, ETHERSCAN_API_BASE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const chain = searchParams.get("chain") || "base";
  const fromDate = searchParams.get("fromDate");   // YYYY-MM-DD
  const toDate = searchParams.get("toDate");
  const limitParam = searchParams.get("limit") || "200"; // default 200 for non-Base

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid or missing wallet address." }, { status: 400 });
  }

  // ---- Base chain: use Blockscout (existing logic, no date filter support, limit=50) ----
  if (chain === "base") {
    try {
      const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
        for (let attempt = 0; attempt < retries; attempt++) {
          const res = await fetch(url);
          if (res.ok) return res;
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
        throw new Error(`Blockscout API failed after ${retries} attempts`);
      };

      const response = await fetchWithRetry(
        `${BLOCKSCOUT_BASE_URL}/addresses/${address}/token-transfers?type=ERC-20`
      );
      const data = await response.json();
      const items = data.items || [];

      const transfers = items.map((tx: any) => {
        const token = tx.token || {};
        const decimals = parseInt(token.decimals || "6", 10);
        const rawAmount = tx.total?.value || "0";
        const amount = (parseInt(rawAmount, 10) / Math.pow(10, decimals)).toFixed(decimals);
        const symbol = token.symbol || "TOKEN";
        const timestamp = tx.timestamp ? new Date(tx.timestamp).toISOString().split("T")[0] : "N/A";

        return {
          date: timestamp,
          token: symbol,
          amount: amount,
          from: tx.from?.hash || "",
          to: tx.to?.hash || "",
          txHash: tx.transaction_hash || "",
          type: "ERC-20",
          tokenAddress: token.address_hash || "",
        };
      });

      return NextResponse.json({ transfers, count: transfers.length });
    } catch (error: any) {
      console.error("Blockscout error:", error);
      return NextResponse.json({ error: "Failed to fetch Base transfers." }, { status: 500 });
    }
  }

  // ---- Other chains: Etherscan V2 ----
  const chainId = CHAIN_IDS[chain];
  if (!chainId) {
    return NextResponse.json({ error: `Unsupported chain: ${chain}` }, { status: 400 });
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Etherscan API key not configured." }, { status: 500 });
  }

  // Build Etherscan API URL for ERC‑20 token transfers (tokentx)
  let url = `${ETHERSCAN_API_BASE}?chainid=${chainId}&module=account&action=tokentx&address=${address}&apikey=${apiKey}`;

  // Add date filters (convert to timestamps)
  if (fromDate) {
    const fromTimestamp = Math.floor(new Date(fromDate + "T00:00:00Z").getTime() / 1000);
    url += `&start_timestamp=${fromTimestamp}`;
  }
  if (toDate) {
    const toTimestamp = Math.floor(new Date(toDate + "T23:59:59Z").getTime() / 1000);
    url += `&end_timestamp=${toTimestamp}`;
  }

  // Add pagination (limit up to 1000)
  let limit = parseInt(limitParam, 10);
  if (isNaN(limit) || limit < 1) limit = 10000;
  if (limit > 1000) limit = 10000;
  url += `&offset=${limit}&sort=desc`; // newest first

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.error("Etherscan error:", errText);
      return NextResponse.json({ error: "Failed to fetch from Etherscan." }, { status: 502 });
    }

    const data = await res.json();
    if (data.status !== "1" && data.message !== "No transactions found") {
      console.error("Etherscan API result error:", data);
      return NextResponse.json({ error: data.result || "Etherscan API returned an error." }, { status: 502 });
    }

    const items = data.result || [];

    const transfers = items.map((tx: any) => {
      const decimals = parseInt(tx.tokenDecimal || "18", 10);
      const rawAmount = tx.value || "0";
      const amount = (parseInt(rawAmount, 10) / Math.pow(10, decimals)).toFixed(decimals);
      const timestamp = tx.timeStamp
        ? new Date(parseInt(tx.timeStamp) * 1000).toISOString().split("T")[0]
        : "N/A";

      return {
        date: timestamp,
        token: tx.tokenSymbol || "TOKEN",
        amount: amount,
        from: tx.from || "",
        to: tx.to || "",
        txHash: tx.hash || "",
        type: "ERC-20",
        tokenAddress: tx.contractAddress || "",
      };
    });

    return NextResponse.json({ transfers, count: transfers.length });
  } catch (error: any) {
    console.error("Etherscan route error:", error);
    return NextResponse.json({ error: "Something went wrong fetching transfers." }, { status: 500 });
  }
}