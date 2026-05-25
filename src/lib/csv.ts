// src/lib/csv.ts
export function convertToCSV(transfers: any[]): string {
  if (transfers.length === 0) return "";

  // Determine if the data has been enriched with price fields
  const hasPriceData = transfers.some(
    (tx: any) => tx.valueAtTx != null || tx.currentValue != null || tx.unrealizedGain != null
  );

  // Base headers
  const headers = ["Date", "Token", "Amount", "From", "To", "Tx Hash"];
  if (hasPriceData) {
    headers.push("Value at Tx (USD)", "Current Value (USD)", "Unrealized Gain (USD)");
  }

  const escapeField = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const rows = transfers.map((tx: any) => {
    const base = [
      tx.date,
      tx.token,
      tx.amount,
      tx.from,
      tx.to,
      tx.txHash,
    ];
    if (hasPriceData) {
      const valueAtTx = tx.valueAtTx != null ? tx.valueAtTx.toFixed(2) : "";
      const currentValue = tx.currentValue != null ? tx.currentValue.toFixed(2) : "";
      const unrealizedGain = tx.unrealizedGain != null ? tx.unrealizedGain.toFixed(2) : "";
      base.push(valueAtTx, currentValue, unrealizedGain);
    }
    return base;
  });

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeField).join(",")),
  ];

  return csvLines.join("\n");
}

export function downloadCSV(transfers: any[]) {
  const csv = convertToCSV(transfers);
  if (!csv) return;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `wallet-schedule-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}