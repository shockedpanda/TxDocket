// src/app/api/enrich/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentPrices, getHistoricalPricesForTransfers } from "@/lib/prices";

export async function POST(request: NextRequest) {
  try {
    const { transfers, chain } = await request.json();
    if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
      return NextResponse.json({ error: "Invalid or empty transfers array" }, { status: 400 });
    }

    // 1. Collect unique token addresses
    const tokenAddresses = Array.from(
      new Set(transfers.map((tx: any) => tx.tokenAddress?.toLowerCase()).filter(Boolean))
    );

    // 2. Fetch current prices for all tokens
    const currentPrices = tokenAddresses.length > 0
      ? await fetchCurrentPrices(tokenAddresses, chain)
      : {};

    // 3. Fetch historical prices for each transfer (by token + date)
    const historicalPrices = await getHistoricalPricesForTransfers(transfers, chain);

    // 4. Enrich each transfer with calculated values
    const enriched = transfers.map((tx: any) => {
      const amount = parseFloat(tx.amount) || 0;
      const histKey = `${tx.tokenAddress?.toLowerCase()}_${tx.date}`;
      const histPrice = historicalPrices[histKey] ?? null;
      const currPrice = currentPrices[tx.tokenAddress?.toLowerCase()] ?? null;

      return {
        ...tx,
        valueAtTx: histPrice ? amount * histPrice : null,
        currentValue: currPrice ? amount * currPrice : null,
        unrealizedGain: histPrice && currPrice ? amount * (currPrice - histPrice) : null,
      };
    });

    // Count how many transfers (rows) got a historical price
    const pricedCount = enriched.filter((tx: any) => tx.valueAtTx !== null).length;
    const totalTxs = enriched.length;

    return NextResponse.json({
      enriched,
      stats: { pricedCount, totalTxs },
      note:
        pricedCount === 0
          ? "No prices could be fetched for these tokens. They may be unsupported or the price service is temporarily unavailable."
          : undefined,
    });
  } catch (error: any) {
    console.error("Enrichment error:", error);
    return NextResponse.json({ error: "Failed to enrich transfers" }, { status: 500 });
  }
}