export async function generateProfessionalReportPDF(
  walletAddress: string,
  chain: string,
  transfers: any[],
  stablecoinSummary: { received: number; sent: number; netFlow: number; breakdown: Record<string, any> },
  brief: string,
  labels: Record<string, string>,
  reviewPeriod: { start: string; end: string }
) {
  const reportHTML = buildProfessionalReportHTML(
    walletAddress, chain, transfers, stablecoinSummary, brief, labels, reviewPeriod
  );

  // Open a new window and write the report directly to it
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) {
    alert("Please allow pop‑ups to generate the professional report.");
    return;
  }
  win.document.write(`
    <html>
      <head>
        <title>TxDocket Professional Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
            padding: 20px;
          }
          @media print {
            @page { margin: 10mm; size: A4; }
          }
        </style>
      </head>
      <body>
        ${reportHTML}
      </body>
    </html>
  `);
  win.document.close();

  // Wait for the document to fully load, then trigger print
  await new Promise(resolve => setTimeout(resolve, 800));
  win.print();
}



// ----------------------------------------------------------------------
// HTML Builder – keep exactly as you already have it
// ----------------------------------------------------------------------
function buildProfessionalReportHTML(
  walletAddress: string,
  chain: string,
  transfers: any[],
  stablecoinSummary: any,
  brief: string,
  labels: Record<string, string>,
  reviewPeriod: { start: string; end: string }
): string {
  // ---- Counterparty Classification Helper ----
  const counterpartyTypes = new Map<string, string>();
  transfers.forEach(tx => {
    const from = tx.from.toLowerCase();
    const to = tx.to.toLowerCase();
    const labelFrom = labels[from] || "";
    const labelTo = labels[to] || "";
    if (!counterpartyTypes.has(from)) {
      if (labelFrom.toLowerCase().includes("exchange") || labelFrom.toLowerCase().includes("binance") || labelFrom.toLowerCase().includes("coinbase"))
        counterpartyTypes.set(from, "Known Exchange");
      else if (labelFrom)
        counterpartyTypes.set(from, "Business Wallet");
      else
        counterpartyTypes.set(from, "Unknown");
    }
    if (!counterpartyTypes.has(to)) {
      if (labelTo.toLowerCase().includes("exchange") || labelTo.toLowerCase().includes("binance") || labelTo.toLowerCase().includes("coinbase"))
        counterpartyTypes.set(to, "Known Exchange");
      else if (labelTo)
        counterpartyTypes.set(to, "Business Wallet");
      else
        counterpartyTypes.set(to, "Unknown");
    }
  });

  // ---- Transaction Table Rows ----
  const tableRows = transfers.map((tx, idx) => {
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
    const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase();
    const direction = isIncoming && !isOutgoing ? "In" : isOutgoing && !isIncoming ? "Out" : isIncoming && isOutgoing ? "Self" : "?";

    const fromLabel = labels[tx.from.toLowerCase()] ||
      (tx.from.length > 20 ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}` : tx.from);
    const toLabel = labels[tx.to.toLowerCase()] ||
      (tx.to.length > 20 ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : tx.to);

    const valueAtTx = tx.valueAtTx != null ? `$${tx.valueAtTx.toFixed(2)}` : "-";
    const currentValue = tx.currentValue != null ? `$${tx.currentValue.toFixed(2)}` : "-";
    const gain = tx.unrealizedGain != null ? `$${tx.unrealizedGain.toFixed(2)}` : "-";

    return `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.token}</td>
        <td style="text-align:right">${tx.amount}</td>
        <td style="color:${direction==="In"?"green":"red"}">${direction}</td>
        <td>${fromLabel}</td>
        <td>${toLabel}</td>
        <td style="text-align:right">${valueAtTx}</td>
        <td style="text-align:right">${currentValue}</td>
        <td style="text-align:right">${gain}</td>
      </tr>
    `;
  }).join("");

  // ---- Risk Flags ----
  const largeTxs = transfers.filter(tx => tx.valueAtTx && tx.valueAtTx > 10000).length;
  const unknownCounterparties = transfers.filter(tx => {
    const fromLabel = labels[tx.from.toLowerCase()] || counterpartyTypes.get(tx.from.toLowerCase());
    const toLabel = labels[tx.to.toLowerCase()] || counterpartyTypes.get(tx.to.toLowerCase());
    return fromLabel === "Unknown" || toLabel === "Unknown";
  }).length;

  const riskFlagsHTML = `
    <ul>
      <li>${largeTxs > 0 ? `<strong>Large transactions:</strong> ${largeTxs} transaction(s) over $10,000.` : "No large transactions detected."}</li>
      <li>${unknownCounterparties > 0 ? `<strong>Unknown counterparties:</strong> ${unknownCounterparties} transfer(s) with unlabeled addresses.` : "All counterparties have labels or known types."}</li>
      <li><strong>Mixer/sanctions exposure:</strong> Not reviewed. Requires specialist screening tool.</li>
      <li><strong>Smart contract interactions:</strong> ${transfers.some(tx => tx.from.toLowerCase() === "0x0000000000000000000000000000000000000000" || tx.to.toLowerCase() === "0x0000000000000000000000000000000000000000") ? "Yes (burn/mint)." : "None detected."}</li>
      <li><strong>Stablecoin concentration:</strong> ${Object.keys(stablecoinSummary.breakdown).length > 0 ? "Activity is stablecoin‑heavy." : "No stablecoins detected."}</li>
      <li><strong>Human review required:</strong> Yes. This report is a support document, not a final compliance conclusion.</li>
    </ul>
  `;

  // ---- Reviewer Questions ----
  const reviewerQuestions = `
    <ol>
      <li>What is the business purpose of this wallet?</li>
      <li>Who controls the wallet?</li>
      <li>Are the stablecoin inflows linked to customers, investors, or treasury funding?</li>
      <li>What is the purpose of each outgoing transfer?</li>
      <li>Are there invoices, agreements, or internal approvals supporting the transactions?</li>
      <li>Are any counterparties related parties?</li>
      <li>Were any transactions linked to DeFi, bridging, staking, swaps, or protocol interactions?</li>
      <li>Were any funds received from or sent to high‑risk counterparties?</li>
      <li>Has the wallet been screened using a specialist blockchain analytics provider?</li>
      <li>Should this wallet be monitored on an ongoing basis?</li>
    </ol>
  `;

  // ---- Executive Summary ----
  const executiveSummary = brief
    ? `<div style="margin: 20px 0; padding: 15px; background: #f9f9ff; border-radius: 8px;">
        <h2>1. Executive Summary</h2>
        <div style="white-space: pre-line;">${brief.replace(/\n/g, "<br>")}</div>
       </div>`
    : `<p><em>No AI brief generated. Please generate the TxDocket Brief first for a complete executive summary.</em></p>`;

  // ---- Full Report ----
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; color:#000; background:#fff;">
    <h1 style="font-size: 24px;">TxDocket Professional Wallet Report</h1>
    <p><strong>Prepared for:</strong> [Client Name] &nbsp;|&nbsp; <strong>Prepared by:</strong> TxDocket</p>
    <p><strong>Wallet Address:</strong> ${walletAddress} &nbsp;|&nbsp; <strong>Chain:</strong> ${chain}</p>
    <p><strong>Review Period:</strong> ${reviewPeriod.start || "N/A"} to ${reviewPeriod.end || "N/A"}</p>

    ${executiveSummary}

    <h2>2. Wallet Overview</h2>
    <table style="width:100%; border-collapse:collapse;">
      <tr><td><strong>Chain Reviewed:</strong></td><td>${chain}</td></tr>
      <tr><td><strong>Review Period:</strong></td><td>${reviewPeriod.start || "any"} – ${reviewPeriod.end || "any"}</td></tr>
      <tr><td><strong>Number of Transactions:</strong></td><td>${transfers.length}</td></tr>
      <tr><td><strong>Stablecoin Flow:</strong></td><td>$${stablecoinSummary.received.toFixed(2)} received, $${stablecoinSummary.sent.toFixed(2)} sent</td></tr>
    </table>

    <h2>3. Stablecoin Flow Summary</h2>
    <p><strong>Total Received:</strong> $${stablecoinSummary.received.toFixed(2)} &nbsp;|&nbsp; <strong>Total Sent:</strong> $${stablecoinSummary.sent.toFixed(2)} &nbsp;|&nbsp; <strong>Net Flow:</strong> $${stablecoinSummary.netFlow.toFixed(2)}</p>
    <ul>
      ${Object.entries(stablecoinSummary.breakdown).map(([sym, data]: any) => `
        <li>${sym}: +$${data.received.toFixed(2)} / -$${data.sent.toFixed(2)}</li>
      `).join("")}
    </ul>

    <h2>4. Transaction Review Table</h2>
    <table style="width:100%; border-collapse:collapse; font-size:10px;">
      <thead>
        <tr style="background:#eee;">
          <th>Date</th><th>Token</th><th>Amount</th><th>Dir</th><th>From</th><th>To</th><th>Value at Tx</th><th>Current Value</th><th>Gain</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <h2>5. Counterparty Classification</h2>
    <ul>
      ${Array.from(counterpartyTypes.entries()).map(([addr, type]) => `
        <li>${addr.slice(0,10)}… – ${type} (Label: ${labels[addr] || "none"})</li>
      `).join("")}
    </ul>

    <h2>6. Risk Flag Checklist</h2>
    ${riskFlagsHTML}

    <h2>7. Reviewer Questions</h2>
    ${reviewerQuestions}

    <h2>8. Conclusion</h2>
    <p>This report is an AI‑assisted, operational documentation layer. It does not replace legal, tax, or regulatory advice. All findings should be independently reviewed.</p>

    <h2>9. Disclaimer</h2>
    <p>This report is provided for informational purposes only. It is not tax, legal, investment, or compliance advice. TxDocket does not guarantee the accuracy of public blockchain data or AI‑generated summaries. Always consult a qualified professional.</p>
  </div>
  `;
}