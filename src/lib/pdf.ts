// src/lib/pdf.ts
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generateReviewPackPDF(
  walletAddress: string,
  chain: string,
  transfers: any[],
  stablecoinSummary: { received: number; sent: number; netFlow: number; breakdown: Record<string, any> },
  brief: string,
  labels: Record<string, string>
) {
  const reportHTML = buildReportHTML(walletAddress, chain, transfers, stablecoinSummary, brief, labels);

  // Create a fully visible container (will be removed immediately after capture)
  const container = document.createElement("div");
  container.innerHTML = reportHTML;
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "800px";
  container.style.opacity = "1";
  container.style.zIndex = "9999";
  container.style.color = "#000";               // ensure text is dark
  container.style.background = "#fff";           // solid white background
  container.style.pointerEvents = "none";      // prevent interaction
  document.body.appendChild(container);

  // Wait for fonts/layout to settle
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: false,
    });

    const imgData = canvas.toDataURL("image/png");
    if (!imgData || imgData === "data:," || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Failed to render report as image (blank canvas)");
    }

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`TxDocket-ReviewPack-${walletAddress.slice(0, 8)}.pdf`);
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    alert("Failed to generate PDF. The report could not be rendered. Please try again.");
  } finally {
    document.body.removeChild(container);
  }
}

// buildReportHTML remains exactly the same as before
function buildReportHTML(
  walletAddress: string,
  chain: string,
  transfers: any[],
  stablecoinSummary: any,
  brief: string,
  labels: Record<string, string>
): string {
  const rowsHTML = transfers.map((tx, idx) => {
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
    const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase();
    let direction = "";
    if (isIncoming && !isOutgoing) direction = "In";
    else if (isOutgoing && !isIncoming) direction = "Out";
    else if (isIncoming && isOutgoing) direction = "Self";
    else direction = "?";

    const fromLabel = labels[tx.from.toLowerCase()] || `${tx.from.slice(0,6)}...${tx.from.slice(-4)}`;
    const toLabel = labels[tx.to.toLowerCase()] || `${tx.to.slice(0,6)}...${tx.to.slice(-4)}`;

    return `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.token}</td>
        <td style="text-align:right">${tx.amount}</td>
        <td style="color:${direction==="In"?"green":direction==="Out"?"red":"gray"}">${direction}</td>
        <td>${fromLabel}</td>
        <td>${toLabel}</td>
        <td style="font-size:10px">${tx.txHash?.slice(0,10)}…</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
      <h1 style="font-size: 24px; margin-bottom: 4px;">TxDocket Review Pack</h1>
      <p style="margin-top:0; color: #555;">Wallet: ${walletAddress} &nbsp;|&nbsp; Chain: ${chain} &nbsp;|&nbsp; Date: ${new Date().toISOString().split("T")[0]}</p>

      <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
        <h2 style="font-size: 18px; margin-bottom: 12px;">💵 Stablecoin Flow Summary</h2>
        <div style="display: flex; gap: 30px; margin-bottom: 12px;">
          <div><strong>Total Received:</strong> $${stablecoinSummary.received.toFixed(2)}</div>
          <div><strong>Total Sent:</strong> $${stablecoinSummary.sent.toFixed(2)}</div>
          <div><strong>Net Flow:</strong> $${stablecoinSummary.netFlow.toFixed(2)}</div>
        </div>
        ${Object.entries(stablecoinSummary.breakdown).map(([sym, data]: any) => `
          <div style="font-size: 14px; margin: 4px 0;">
            <strong>${sym}:</strong> +$${data.received.toFixed(2)} / -$${data.sent.toFixed(2)}
          </div>
        `).join("")}
      </div>

      <div style="margin: 20px 0; padding: 15px; background: #f9f9ff; border-radius: 8px;">
        <h2 style="font-size: 18px; margin-bottom: 12px;">📋 TxDocket Brief</h2>
        <div style="white-space: pre-line; font-size: 14px; line-height: 1.5;">${brief ? brief.replace(/\n/g, "<br>") : "<p>No brief generated.</p>"}</div>
      </div>

      <h2 style="font-size: 18px; margin-top: 24px;">Transaction Schedule</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px;">
        <thead>
          <tr style="background: #eee;">
            <th>Date</th><th>Token</th><th>Amount</th><th>Dir</th><th>From</th><th>To</th><th>Tx Hash</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <p style="font-size: 10px; color: #888; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 12px;">
        This report was generated by TxDocket (https://txdocket.vercel.app). It is AI-assisted and does not constitute financial, tax, or legal advice.
      </p>
    </div>
  `;
}