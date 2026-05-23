// src/app/api/transfers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BLOCKSCOUT_BASE_URL } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: "Invalid or missing wallet address. Must be a 0x... address." },
      { status: 400 }
    );
  }
  
    try {
    const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        const res = await fetch(url);
        if (res.ok) return res;
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 1000)); // wait 1 second
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
    console.error("Error fetching transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfer data. Please try again later." },
      { status: 500 }
    );
  }
}