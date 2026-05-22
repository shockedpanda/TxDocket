"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { Transfer } from "@/types";
import { downloadCSV } from "@/lib/csv";
import { DONATION_ADDRESS } from "@/lib/constants";
import DonationSection from "@/components/DonationSection";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    setTransfers([]);

    if (!walletAddress.trim()) {
      setError("Please enter a wallet address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/transfers?address=${walletAddress.trim()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setTransfers(data.transfers || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const shorten = (hex: string) =>
    hex.length > 20 ? `${hex.slice(0, 6)}...${hex.slice(-4)}` : hex;

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-16">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Title & headline */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Base Wallet Records
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Turn Base wallet activity into clean transaction schedules.
          </p>
        </div>

        {/* Wallet address input */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 space-y-4 border border-gray-200 dark:border-gray-700">
          <label
            htmlFor="wallet"
            className="block text-sm font-medium text-left text-gray-700 dark:text-gray-200"
          >
            Enter a public Base wallet address
          </label>
          <input
            id="wallet"
            type="text"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? "Loading..." : "Generate Schedule"}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
            🔒 No private keys or wallet connections are ever required.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="text-sm text-gray-500 dark:text-gray-400 text-left space-y-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="font-medium">Important Disclaimer</p>
          <p>
            This tool provides an operational documentation layer for wallet activity.
            It is <strong>not</strong> tax advice, legal advice, AML screening, sanctions
            clearance, blockchain forensics, accounting conclusions, or compliance certification.
            Always consult a qualified professional before making financial, legal, or regulatory decisions.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Card
            emoji="📊"
            title="Free CSV Schedule"
            description="Download a clean transaction schedule of your Base wallet activity, ready for spreadsheets."
          />
          <Card
            emoji="💵"
            title="Stablecoin Flow Summary"
            description="Quickly see USDC and other stablecoin inflows and outflows across your wallet."
          />
          <Card
            emoji="📋"
            title="Review-Ready Reports"
            description="Get pre‑formatted wallet activity packs for your accountant, auditor, or team."
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-xl text-left">
            {error}
          </div>
        )}

        {/* Results section with CSV download */}
        {transfers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-left">
                Token Transfers ({transfers.length})
              </h2>
              <button
                onClick={() => downloadCSV(transfers)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ⬇ Download CSV
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Token</th>
                  <th className="py-2 pr-4 text-right">Amount</th>
                  <th className="py-2 pr-4">From</th>
                  <th className="py-2 pr-4">To</th>
                  <th className="py-2">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((tx, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 pr-4">{tx.date}</td>
                    <td className="py-2 pr-4 font-medium">{tx.token}</td>
                    <td className="py-2 pr-4 text-right">{tx.amount}</td>
                    <td className="py-2 pr-4 text-xs font-mono">{shorten(tx.from)}</td>
                    <td className="py-2 pr-4 text-xs font-mono">{shorten(tx.to)}</td>
                    <td className="py-2 text-xs font-mono">
                      <a
                        href={`https://basescan.org/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {shorten(tx.txHash)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && transfers.length === 0 && !error && (
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            No transactions to display. Try entering a different wallet address.
          </div>
        )}

        {/* Donation section */}
        <DonationSection address={DONATION_ADDRESS} />
      </div>
    </main>
  );
}