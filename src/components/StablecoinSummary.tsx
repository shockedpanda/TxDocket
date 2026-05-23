// src/components/StablecoinSummary.tsx
import { Transfer } from "@/types";
import { STABLECOINS } from "@/lib/constants";

interface StablecoinSummaryProps {
  transfers: Transfer[];
  walletAddress: string;
}

export default function StablecoinSummary({ transfers, walletAddress }: StablecoinSummaryProps) {
  const lowerAddress = walletAddress.toLowerCase();

  // Filter only stablecoin transfers
  const stableTransfers = transfers.filter(
    (tx) => tx.tokenAddress && STABLECOINS[tx.tokenAddress.toLowerCase()]
  );

  if (stableTransfers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-left">
        <h3 className="text-lg font-semibold mb-2">💵 Stablecoin Flow</h3>
        <p className="text-sm text-gray-500">No stablecoin activity detected.</p>
      </div>
    );
  }

  // Calculate totals per token
  const totals: Record<string, { received: number; sent: number }> = {};

  stableTransfers.forEach((tx) => {
    const symbol = STABLECOINS[tx.tokenAddress.toLowerCase()] || tx.token;
    const amount = parseFloat(tx.amount) || 0;

    if (!totals[symbol]) {
      totals[symbol] = { received: 0, sent: 0 };
    }

    // Determine direction by comparing 'from' and 'to' with the queried address
    if (tx.to.toLowerCase() === lowerAddress) {
      totals[symbol].received += amount;
    } else if (tx.from.toLowerCase() === lowerAddress) {
      totals[symbol].sent += amount;
    }
    // else: both not matching? shouldn't happen, but ignore
  });

  // Calculate overall totals
  const totalReceived = Object.values(totals).reduce((sum, t) => sum + t.received, 0);
  const totalSent = Object.values(totals).reduce((sum, t) => sum + t.sent, 0);
  const netFlow = totalReceived - totalSent;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-left">
      <h3 className="text-lg font-semibold mb-4">💵 Stablecoin Flow Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-xl">
          <p className="text-sm text-green-600 dark:text-green-300">Total Received</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-200">
            ${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-300">Total Sent</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-200">
            ${totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${netFlow >= 0 ? "bg-blue-50 dark:bg-blue-900" : "bg-orange-50 dark:bg-orange-900"}`}>
          <p className="text-sm text-blue-600 dark:text-blue-300">Net Flow</p>
          <p className={`text-2xl font-bold ${netFlow >= 0 ? "text-blue-700 dark:text-blue-200" : "text-orange-700 dark:text-orange-200"}`}>
            {netFlow >= 0 ? "+" : ""}{netFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      {/* Per token breakdown */}
      <div className="mt-4 space-y-2">
        {Object.entries(totals).map(([symbol, data]) => (
          <div key={symbol} className="flex justify-between text-sm">
            <span className="font-medium">{symbol}</span>
            <span className="text-green-600">+${data.received.toLocaleString()}</span>
            <span className="text-red-600">-${data.sent.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}