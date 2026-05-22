// src/lib/csv.ts
import { Transfer } from "@/types"; // we'll create this type file in a moment

export function convertToCSV(transfers: Transfer[]): string {
  if (transfers.length === 0) return "";

  // Headers matching our table columns
  const headers = ["Date", "Token", "Amount", "From", "To", "Tx Hash"];
  const rows = transfers.map((tx) => [
    tx.date,
    tx.token,
    tx.amount,
    tx.from,
    tx.to,
    tx.txHash,
  ]);

  // Escape fields that might contain commas or quotes
  const escapeField = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeField).join(",")),
  ];

  return csvLines.join("\n");
}

export function downloadCSV(transfers: Transfer[]) {
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