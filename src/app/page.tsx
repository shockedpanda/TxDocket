"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { Transfer } from "@/types";
import { downloadCSV } from "@/lib/csv";
import { DONATION_ADDRESS } from "@/lib/constants";
import DonationSection from "@/components/DonationSection";
import { isScamToken } from "@/lib/utils";
import StablecoinSummary from "@/components/StablecoinSummary";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hideScam, setHideScam] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [brief, setBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState("");
  const [selectedChain, setSelectedChain] = useState("base");

  // Map chain to block explorer URL for tx links
  const getExplorerUrl = (chain: string, txHash: string) => {
    const explorers: Record<string, string> = {
      base: "https://basescan.org/tx/",
      ethereum: "https://etherscan.io/tx/",
      arbitrum: "https://arbiscan.io/tx/",
      optimism: "https://optimistic.etherscan.io/tx/",
    };
    return (explorers[chain] || explorers.base) + txHash;
  };

  const handleGenerate = async () => {
    setError("");
    setTransfers([]);
    setBrief("");          // ← clear old brief
    setBriefError("");     // ← clear any brief errors

    if (!walletAddress.trim()) {
      setError("Please enter a wallet address.");
      return;
    }

    setLoading(true);
    try {
      let apiUrl: string;
      if (selectedChain === "base") {
        // Base uses Blockscout (existing route) – date filters client‑side only
        apiUrl = `/api/transfers?address=${walletAddress.trim()}`;
        if (startDate) apiUrl += `&fromDate=${startDate}`;
        if (endDate) apiUrl += `&toDate=${endDate}`;
      } else {
        // Other chains use Etherscan V2 – date filters work server‑side, limit 200
        apiUrl = `/api/transfers?chain=${encodeURIComponent(selectedChain)}&address=${walletAddress.trim()}&limit=10000`;
        if (startDate) apiUrl += `&fromDate=${startDate}`;
        if (endDate) apiUrl += `&toDate=${endDate}`;
      }

      const res = await fetch(apiUrl);
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

  const handleGenerateBrief = async () => {
    setBriefError("");
    setBrief("");
    setBriefLoading(true);

    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transfers: transfers,
          walletAddress: walletAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate brief");
      }

      setBrief(data.brief);
    } catch (err: any) {
      setBriefError(err.message || "Something went wrong.");
    } finally {
      setBriefLoading(false);
    }
  };

  const shorten = (hex: string) =>
    hex.length > 20 ? `${hex.slice(0, 6)}...${hex.slice(-4)}` : hex;

  const displayedTransfers = hideScam
    ? transfers.filter((tx) => !isScamToken(tx.token))
    : transfers;

  // Client‑side date filter (used for Base; for other chains it's redundant but harmless)
  const filteredByDate = displayedTransfers.filter((tx) => {
    if (!startDate && !endDate) return true;
    const txDate = new Date(tx.date).getTime();
    const start = startDate ? new Date(startDate + "T00:00:00").getTime() : null;
    const end = endDate ? new Date(endDate + "T23:59:59").getTime() : null;
    if (start && txDate < start) return false;
    if (end && txDate > end) return false;
    return true;
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-16">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Title & headline */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            TxDocket
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Clean transaction schedules for EVM wallets.
          </p>
        </div>

        {/* Wallet address input */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 space-y-4 border border-gray-200 dark:border-gray-700">
          <div className="mb-4 text-left">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Chain</label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="base">Base</option>
              <option value="ethereum">Ethereum</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
            </select>
          </div>
          <label
            htmlFor="wallet"
            className="block text-sm font-medium text-left text-gray-700 dark:text-gray-200"
          >
            Enter a public wallet address
          </label>
          <input
            id="wallet"
            type="text"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 text-left">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div className="flex-1 text-left">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
              ⓘ Base returns the latest 50 transfers only — date filters are applied after fetching. Other chains support server‑side date filtering and return up to 10,000 transfers. API upgrades for historical Base data are planned.
          </p>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {loading ? "Fetching Transactions..." : "Generate Schedule"}
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
            description="Download a clean transaction schedule of your wallet activity, ready for spreadsheets."
          />
          <Card
            emoji="💵"
            title="Stablecoin Flow Summary"
            description="Quickly see USDC and other stablecoin inflows and outflows across your wallet."
          />
          <Card
            emoji="📋"
            title="Review-Ready Reports"
            description="TxDocket packs wallet activity into a clear handover ready for your accountant, auditor, or team."
          />
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 overflow-x-auto animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div></th>
                  <th className="py-2 pr-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></th>
                  <th className="py-2 pr-4 text-right"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div></th>
                  <th className="py-2 pr-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></th>
                  <th className="py-2 pr-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></th>
                  <th className="py-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 pr-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                    <td className="py-2 pr-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></td>
                    <td className="py-2 pr-4 text-right"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div></td>
                    <td className="py-2 pr-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="py-2 pr-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                    <td className="py-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-xl text-left">
            {error}
          </div>
        )}

        {/* Results table with CSV download */}
        {!loading && transfers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <StablecoinSummary transfers={transfers} walletAddress={walletAddress} />

            {/* TxDocket Brief section */}
            <div className="mt-6">
              {!brief && !briefLoading && (
                <button
                  onClick={handleGenerateBrief}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
                >
                  ✨ Generate TxDocket Brief
                </button>
              )}

              {briefLoading && (
                <div className="text-center py-4 animate-pulse text-gray-500">
                  Generating brief...
                </div>
              )}

              {briefError && (
                <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-xl text-left">
                  {briefError}
                </div>
              )}

              {brief && (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">📋 TxDocket Brief</h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(brief);
                        alert("Brief copied to clipboard");
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-line">
                    {brief}
                  </div>
                  <p className="text-xs text-gray-500 mt-4 border-t pt-4 dark:border-gray-700">
                    ⚠️ AI-generated summary. Not financial, tax, or legal advice. Always consult a qualified professional.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-left">
                Token Transfers ({filteredByDate.length}{hideScam ? " (spam hidden)" : ""})
              </h2>
              <div className="flex items-center gap-3">
                {/* Toggle switch */}
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                  <span>
                    Hide spam
                    <span
                      title="Hides tokens whose names contain suspicious keywords (e.g. airdrop, claim, t.me). Does not guarantee a token is safe — always DYOR."
                      className="ml-1 cursor-help text-gray-400 dark:text-gray-500 text-xs"
                    >
                      ⓘ
                    </span>
                  </span>
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={hideScam}
                      onChange={(e) => setHideScam(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <button
                  onClick={() => downloadCSV(filteredByDate)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  ⬇ Download CSV
                </button>
              </div>
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
                {filteredByDate.map((tx, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 pr-4">{tx.date}</td>
                    <td className="py-2 pr-4 font-medium max-w-[120px] truncate" title={tx.token}>
                      {tx.token}
                    </td>
                    <td className="py-2 pr-4 text-right max-w-[100px] truncate" title={tx.amount}>
                      {tx.amount}
                    </td>
                    <td className="py-2 pr-4 text-xs font-mono max-w-[100px] truncate" title={tx.from}>
                      {shorten(tx.from)}
                    </td>
                    <td className="py-2 pr-4 text-xs font-mono max-w-[100px] truncate" title={tx.to}>
                      {shorten(tx.to)}
                    </td>
                    <td className="py-2 text-xs font-mono">
                      <a
                        href={getExplorerUrl(selectedChain, tx.txHash)}
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
            {(startDate || endDate) && (
              <p className="text-xs text-gray-500 mt-3">
                Showing transfers between {startDate || "any"} and {endDate || "any"}.
              </p>
            )}
            {hideScam && displayedTransfers.length < transfers.length && (
              <p className="text-xs text-gray-500 mt-3">
                {transfers.length - displayedTransfers.length} spam token(s) hidden.
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredByDate.length === 0 && !error && (
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            {transfers.length === 0
              ? "No transactions to display. Try entering a different wallet address."
              : "All transactions hidden by spam filter."}
          </div>
        )}

        {/* Donation section */}
        <DonationSection address={DONATION_ADDRESS} />
      </div>
    </main>
  );
}