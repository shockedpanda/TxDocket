// src/app/api/brief/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { transfers, walletAddress } = await request.json();

    if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
      return NextResponse.json(
        { error: "No transfer data provided." },
        { status: 400 }
      );
    }

    const transferSummary = transfers
      .slice(0, 50)
      .map(
        (tx: any, idx: number) =>
          `${idx + 1}. ${tx.date} | ${tx.token} | ${tx.amount} | from ${tx.from} | to ${tx.to} | tx ${tx.txHash}`
      )
      .join("\n");

    const prompt = `
You are a financial documentation assistant. Write a professional "TxDocket Brief" for the following Base wallet activity.

Wallet address: ${walletAddress || "N/A"}
Number of transactions provided: ${transfers.length}

Transactions:
${transferSummary}

The brief should include:
1. Period covered (earliest and latest transaction dates)
2. Total number of transactions
3. Stablecoin activity summary (if any USDC, USDT, DAI appear, estimate total inflow/outflow based on the data provided)
4. Notable counterparties (addresses that appear frequently)
5. Any unusual patterns (very large amounts, spam tokens, repetitive transfers)

Keep the tone professional and concise. Do not invent data. If stablecoins are not present, state that. Limit the brief to 300 words.
`.trim();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured." },
        { status: 500 }
      );
    }

    // Primary: Google Gemma 4 26B (free, excellent for summaries)
    // Fallback: DeepSeek V4 Flash (free, strong reasoning)
    const models = [
      "google/gemma-4-26b-a4b-it",
      "deepseek/deepseek-v4-flash",
    ];

    let lastError: any;
    for (const model of models) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 800,
            temperature: 0.3,
          }),
        });

        if (res.ok) {
          const completion = await res.json();
          const briefText = completion?.choices?.[0]?.message?.content?.trim();
          if (briefText) {
            return NextResponse.json({ brief: briefText });
          }
        } else {
          lastError = await res.json();
          console.warn(`Model ${model} failed:`, lastError);
        }
      } catch (err) {
        console.warn(`Model ${model} network error:`, err);
      }
    }

    console.error("All free models failed. Last error:", lastError);
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again in a moment." },
      { status: 502 }
    );
  } catch (error: any) {
    console.error("Brief generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong generating the brief." },
      { status: 500 }
    );
  }
}